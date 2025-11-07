/* eslint-disable prefer-const */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/modules/user/interface/user.interface';
import { Role } from 'src/modules/role/interface/role.interface';
import { Model } from 'mongoose';
import { MiscCLass } from 'src/services/misc.service';
import { Channel } from 'src/modules/chat/interface/channel.interface';
import { ChannelMessage } from 'src/modules/chat/interface/channel-message.interface';
import { SendMessageDto } from 'src/modules/chat/dto/send-message.dto';
import escapeStringRegexp from 'escape-string-regexp';
import { EntityChannelStatus } from 'src/modules/chat/interface/entity-channel-status.interface';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { CreateChannelDto } from 'src/modules/chat/dto/create-channel.dto';
import { DeleteMessageDto } from 'src/modules/chat/dto/delete-messages.dto';
import { Service } from 'aws-sdk';
import fbaseadmin from 'src/services/config/firebase.config';
import { ServiceRequest } from 'src/modules/service-request/interface/service-request-interface.interface';
// import { db } from '../services/firebase/config';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    @InjectModel('Channel') private readonly channelModel: Model<Channel>,
    @InjectModel('ChannelMessage')
    private readonly channelMessageModel: Model<ChannelMessage>,
    @InjectModel('EntityChannelStatus')
    private readonly entityChannelStatusModel: Model<EntityChannelStatus>,
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
    private miscService: MiscCLass,
    private notificationService: NotificationService,
  ) {}

  async createChannel(user: any, body: CreateChannelDto) {
    const { service_id, receiver_id } = body;
    let serviceId = null;
    if (service_id) {
      const service = await this.serviceRequestModel.findOne({
        _id: service_id,
      });
      if (!service) {
        throw new BadRequestException({
          status: 'error',
          message: 'Unable to to start channel, service request not found',
        });
      }
      serviceId = service._id;
      if (
        service.beneficiary.toString() !== receiver_id.toString() &&
        service.care_giver.toString() !== receiver_id.toString()
      ) {
        throw new BadRequestException({
          status: 'error',
          message: 'Unable to to start channel with this user',
        });
      }
    }
    let channel_id = null;

    const receiver: any = await this.userModel
      .findOne({ _id: receiver_id })
      .exec();

    if (!receiver) {
      throw new BadRequestException({
        status: 'error',
        message: 'Unable to start channel',
      });
    }

    const openChannel = await this.channelModel
      .findOne({
        $or: [
          {
            'initiator.user_id': receiver._id,
            'receiver.user_id': user._id,
            service: serviceId,
            active: true,
          },
          {
            'receiver.user_id': receiver._id,
            'initiator.user_id': user._id,
            service: serviceId,
            active: true,
          },
        ],
      })
      .exec();

    if (openChannel) {
      channel_id = openChannel._id;
    } else {
      const channel = new this.channelModel({
        service: service_id,
        initiator: {
          user_id: user._id,
          firebase_uid: user.firebase_uid,
          full_name: `${user.first_name} ${user.last_name}`,
          profile_picture: user.profile_picture,
          unread: 0,
        },
        receiver: {
          user_id: receiver._id,
          firebase_uid: receiver.firebase_uid,
          full_name: `${receiver.first_name} ${receiver.last_name}`,
          profile_picture: receiver.profile_picture,
          unread: 1,
        },
        active: true,
      });
      await channel.save();

      channel_id = channel._id;
    }
    // const token = await this.ablyService.authorize();
    return {
      status: 'success',
      channel_id,
      // ably_token: token,
    };
  }

  async sendMessage(user: any, sendMessageDto: SendMessageDto) {
    const { channel_id, type, message } = sendMessageDto;
    let receiver_id = null;

    const channel = await this.channelModel
      .findOne({
        $or: [
          {
            'initiator.user_id': user._id,
            _id: channel_id,
          },
          { 'receiver.user_id': user._id, _id: channel_id },
        ],
      })
      .exec();

    if (!channel) {
      throw new BadRequestException({
        status: 'error',
        message: 'Channel does not exist',
      });
    }

    if (user._id.toString() == channel.initiator.user_id.toString()) {
      receiver_id = channel.receiver.user_id;
    }
    if (user._id.toString() == channel.receiver.user_id.toString()) {
      receiver_id = channel.initiator.user_id;
    }
    //add message and put last message
    let it_not_receiver_current = true;
    const entity_channel = await this.entityChannelStatusModel
      .findOne({ user_id: receiver_id })
      .exec();

    if (entity_channel) {
      it_not_receiver_current = entity_channel.current_channel != channel._id;
    }

    const query =
      channel.initiator.user_id == receiver_id && it_not_receiver_current
        ? {
            $inc: {
              'initiator.unread': +1,
            },
          }
        : {
            $inc: {
              'receiver.unread': +1,
            },
          };
    const channel_message = new this.channelMessageModel({
      channel: channel_id,
      sender: {
        user_id: user._id,
        full_name: `${user.first_name} ${user.last_name}`,
        profile_picture: user.profile_picture,
        unread: 0,
      },
      type,
      message: message,
    });

    await channel_message.save();

    await this.channelModel
      .findOneAndUpdate(
        {
          $or: [
            {
              'initiator.user_id': receiver_id,
            },
            { 'receiver.user_id': receiver_id },
          ],
          _id: channel_id,
        },
        {
          ...query,
          last_message: channel_message,
        },
      )
      .exec();
    //send to receiver firebase here
    // await this.ablyService.publish(channel_id, user, { message }, service_id);
    const receiver = await this.userModel.findOne({ _id: receiver_id });
    const title = `New message from ${user.first_name}`;
    await this.notificationService.sendMessage({
      user: receiver,
      title,
      message,
      resource: 'chat',
      resource_id: channel_id,
    });
    return {
      status: 'success',
      message: 'Message sent successfully',
    };
  }

  async fetchServiceChannels(user: any, serviceId: any) {
    // console.log(channelId);
    const channels = await this.channelModel
      .find({
        $or: [
          {
            'initiator.user_id': user._id,
          },
          { 'receiver.user_id': user._id },
        ],
        service: serviceId,
      })
      .populate('service')
      .sort({ createdAt: -1 })
      .exec();

    return {
      status: 'success',
      message: 'Channel fetched successfully',
      channels,
    };
  }

  async fetchChannelMessages(user: any, channelId: any) {
    console.log(channelId);
    let deleteFor = '';
    const channel = await this.channelModel
      .findOne({
        $or: [
          {
            'initiator.user_id': user,
          },
          { 'receiver.user_id': user },
        ],
        _id: channelId,
      })
      .exec();

    if (!channel) {
      throw new NotFoundException({
        status: 'error',
        message: 'Cannot find this channel for this user',
      });
    }

    if (user._id.toString() == channel.initiator.user_id.toString()) {
      deleteFor = 'is_deleted_initiator';
    }
    if (user._id.toString() == channel.receiver.user_id.toString()) {
      deleteFor = 'is_deleted_receiver';
    }

    const channel_messages = await this.channelMessageModel
      .find({
        channel: channelId,
        [deleteFor]: false,
      })
      .sort({ createdAt: -1 })
      .exec();

    return {
      status: 'success',
      message: 'Channel messages fetched successfully',
      channel_messages,
    };
  }

  async fetchUserChannels(user: any, params: any) {
    console.log(
      '🚀 ~ file: chats.service.ts ~ line 328 ~ ChatsService ~ fetchUserChannels ~ params',
      params,
    );
    let query1 = {};
    let query2 = {};
    for (let value in params) {
      const $regex = RegExp(params[value]);
      const $options = 'i';
      query1[`receiver.${value}`] = { $regex };
      query2[`initiator.${value}`] = { $regex };
    }
    const chat_list = await this.channelModel
      .find({
        $or: [
          {
            'initiator.user_id': user._id,
            ...query1,
          },
          { 'receiver.user_id': user._id, ...query2 },
        ],
      })
      .populate('service')
      .sort({ createdAt: -1 });

    return {
      status: 'success',
      message: 'User chat list fetched successfully',
      chat_list,
    };
  }

  async deleteMessages(user: any, body: DeleteMessageDto) {
    const { channelId, messageIds } = body;
    let deleteFor = '';
    const channel = await this.channelModel
      .findOne({
        $or: [
          {
            'initiator.user_id': user,
          },
          { 'receiver.user_id': user },
        ],
        _id: channelId,
      })
      .exec();

    if (user._id.toString() == channel.initiator.user_id.toString()) {
      deleteFor = 'is_deleted_initiator';
    }
    if (user._id.toString() == channel.receiver.user_id.toString()) {
      deleteFor = 'is_deleted_receiver';
    }

    await this.channelMessageModel.updateMany(
      { _id: { $in: messageIds } },
      { [deleteFor]: true },
      {
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return {
      status: 'success',
      message: 'Messages deleted successfully',
    };
  }

  // Function to fetch the last message on a channel
  async fetchLastMessage(channelId) {
    let admin = fbaseadmin;

    const messagesRef = admin
      .firestore()
      .collection('chats')
      .doc(channelId)
      .collection('messages');
    const querySnapshot = await messagesRef
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    const lastMessage = querySnapshot.docs[0]?.data();
    return lastMessage;
  }

  // Function to fetch the number of unread messages on a channel
  async fetchUnreadMessageCount(channelId, userId) {
    let admin = fbaseadmin;

    const channelsRef = admin.firestore().collection('chats');
    const channelDoc = await channelsRef.doc(channelId).get();
    const channelData = channelDoc?.data();
    const unreadMessageCount = channelData?.unreadMessagesCount[userId];
    return unreadMessageCount;
  }

  // Function to fetch the last message and unread message count for a list of channels
  async fetchLastMessagesAndUnreadMessageCounts(user: any) {
    const userId = user.firebase_uid;
    console.log(
      '🚀 ~ file: chat.service.ts:400 ~ ChatService ~ fetchLastMessagesAndUnreadMessageCounts ~ userId:',
      userId,
    );

    const lastMessagesAndUnreadMessageCounts = [];
    const channels = await this.channelModel.find({
      $or: [
        {
          'initiator.user_id': user._id,
        },
        { 'receiver.user_id': user._id },
      ],
      // select: '_id active belongs_to initiator receiver',
    });

    for (const channel of channels) {
      // if (channel.createdBy === userId || channel.type !== 'private') {
      //   continue;
      // }

      const lastMessage = await this.fetchLastMessage(String(channel._id));
      const unreadMessageCount = await this.fetchUnreadMessageCount(
        String(channel._id),
        String(userId),
      );

      lastMessagesAndUnreadMessageCounts.push({
        ...channel.toObject(),
        channelId: channel.id,
        firebaseLastMessage: lastMessage,
        unreadMessageCount: unreadMessageCount ?? 0,
      });
    }

    return {
      status: 'success',
      message: 'Message history fetched',
      data: lastMessagesAndUnreadMessageCounts,
    };
  }
}
