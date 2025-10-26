import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from 'src/modules/notification/interface/Notification.interface';
import { User } from 'src/modules/user/interface/user.interface';
import { FirebaseService } from 'src/services/firebase.service';
import { MiscCLass } from 'src/services/misc.service';
import { CreateBroadcastDto } from 'src/modules/notification/dto/broadcast.dto';
import { Broadcast } from 'src/modules/notification/interface/broadcast.interface';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel('Notification')
    private readonly notificationModel: Model<Notification>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Broadcast') private readonly broadcastModel: Model<Broadcast>,
    private firebaseService: FirebaseService,
    private miscService: MiscCLass,
  ) {}

  async sendMessage(payload: {
    user: any;
    title: string;
    message: string;
    resource: string;
    resource_id?: string;
  }) {
    const { user, title, message, resource, resource_id } = payload;
    const notification = new this.notificationModel({
      message,
      title,
      user: user._id,
      type: 'individual',
      resource: resource,
      resource_id: resource_id,
    });

    await notification.save();

    await this.userModel
      .findByIdAndUpdate(user._id, {
        $inc: { notification_counter: 1 },
      })
      .exec();

    await this.firebaseService.sendToUser(user, title, message, '');
    return;
  }

  async fetchUserNotifications(user: any, params?: any) {
    const { page = 1, pageSize = 10 } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const notifications = await this.notificationModel
      .find({ $or: [{ user: user._id }, { isGeneral: true }] })
      .sort({ createdAt: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .exec();

    return {
      status: 'success',
      message: 'Notifications fetched',
      data: notifications,
    };
  }

  async openNotifications(user: any) {
    await this.userModel
      .findByIdAndUpdate(user._id, {
        notification_counter: 0,
      })
      .exec();

    return {
      status: 'success',
    };
  }

  async sendNotification(broadcastDto: CreateBroadcastDto) {
    const { title, body } = broadcastDto;

    await this.firebaseService.sendToGeneral(title, body, '');

    const notification = new this.notificationModel({
      message: body,
      title,
      type: 'broadcast',
      isGeneral: true,
    });

    await notification.save();

    await this.userModel
      .updateMany({}, { $inc: { notification_counter: 1 } })
      .exec();

    return;
  }

  async createBroadcast(broadcastDto: CreateBroadcastDto) {
    const { isDraft } = broadcastDto;
    const newBroadcast = new this.broadcastModel({
      ...broadcastDto,
    });
    await newBroadcast.save();

    if (!isDraft) {
      await this.sendNotification(broadcastDto);
    }

    return {
      status: 'success',
      message: 'Broadcast created',
    };
  }

  async getBroadcasts(params: any) {
    const query = {};
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    for (const value in rest) {
      query[value] = rest[value];
    }

    const broadcasts = await this.broadcastModel
      .find(query)
      .skip(pagination.offset)
      .limit(pagination.limit)
      .exec();

    const count = await this.broadcastModel.countDocuments(query).exec();

    return {
      status: 'success',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: broadcasts,
    };
  }

  async getSingleBroadcast(id: string) {
    const broadcast = await this.broadcastModel.findOne({ _id: id }).exec();

    if (!broadcast) {
      throw new NotFoundException({
        success: 'false',
        message: 'Broadcast not found',
      });
    }

    return {
      status: 'success',
      message: 'broadcast fetched',
      data: broadcast,
    };
  }

  async editBroadcast(
    broadcastId: string,
    broadcastDto: Partial<CreateBroadcastDto>,
  ) {
    const { isDraft } = broadcastDto;
    const broadcast: Broadcast = await this.broadcastModel.findOne({
      _id: broadcastId,
    });
    if (!broadcast) {
      throw new NotFoundException({
        success: 'false',
        message: 'Broadcast not found',
      });
    }

    for (const value in broadcastDto) {
      broadcast[value] = broadcastDto[value];
    }

    await broadcast.save();

    if (!isDraft) {
      await this.sendNotification(broadcast);
    }

    return {
      status: 'success',
      message: 'Broadcast updated',
    };
  }

  async resendBroadcast(broadcastId: string) {
    const broadcast = await this.broadcastModel.findOne({
      _id: broadcastId,
    });
    if (!broadcast) {
      throw new NotFoundException({
        success: 'false',
        message: 'Broadcast not found',
      });
    }

    await this.sendNotification(broadcast);

    return {
      status: 'success',
      message: 'Broadcast sent',
    };
  }

  async deleteBroadcast(broadcastId: string) {
    const broadcast = await this.broadcastModel.findOne({
      _id: broadcastId,
    });
    if (!broadcast) {
      throw new NotFoundException({
        success: 'false',
        message: 'Broadcast not found',
      });
    }

    await broadcast.remove();

    return {
      status: 'success',
      message: 'Broadcast deleted',
    };
  }
}
