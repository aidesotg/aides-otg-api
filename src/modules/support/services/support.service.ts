import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ticket } from '../interface/ticket.interface';
import { TicketMessage } from '../interface/ticket-message.interface';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreateTicketMessageDto,
  TicketQueryDto,
} from '../dto/support.dto';
import { MiscCLass } from 'src/services/misc.service';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import constants from 'src/framework/constants';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel('Ticket') private readonly ticketModel: Model<Ticket>,
    @InjectModel('TicketMessage')
    private readonly ticketMessageModel: Model<TicketMessage>,
    private miscService: MiscCLass,
    private notificationService: NotificationService,
  ) {}

  generateTicketNumber(): string {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `#${timestamp}${random}`;
  }

  async createTicket(createTicketDto: CreateTicketDto, user: any) {
    const ticketNumber = this.generateTicketNumber();

    const data: any = {
      ...createTicketDto,
      ticket_number: ticketNumber,
      created_by: user._id,
    };

    if (createTicketDto.user) {
      data.created_by_admin = true;
      data.created_by = createTicketDto.user;
    }

    const newTicket = new this.ticketModel(data);
    const ticket = await newTicket.save();

    // Send notification to support team
    // await this.notificationService.sendMessage(
    //   { _id: 'admin' }, // This would be the admin user
    //   'New Support Ticket',
    //   `New ticket ${ticketNumber} has been created by ${user.fullname}`,
    //   ticket._id,
    // );

    return {
      status: 'success',
      message: 'Ticket created successfully',
      data: ticket,
    };
  }

  async getTickets(params: any, user?: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = { is_deleted: false };

    // If user is not admin/support, only show their tickets
    // if (
    //   user.role !== constants.roles.SUPER_ADMIN &&
    //   user.role !== constants.roles.SUPPORT_ADMIN
    // ) {
    //   query.created_by = user._id;
    // }

    if (user) query.created_by = user._id;

    if (rest.status) query.status = rest.status;
    if (rest.category) query.category = rest.category;
    if (rest.priority) query.priority = rest.priority;
    if (rest.assigned_to) query.assigned_to = rest.assigned_to;

    if (rest.start_date || rest.end_date) {
      query.createdAt = {};
      if (rest.start_date) query.createdAt.$gte = new Date(rest.start_date);
      if (rest.end_date) query.createdAt.$lte = new Date(rest.end_date);
    }

    console.log(query);

    const tickets = await this.ticketModel
      .find(query)
      .populate('created_by', ['fullname', 'email'])
      .populate('assigned_to', ['fullname', 'email'])
      .populate('user_type', ['name'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.ticketModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      tickets,
    };
  }

  async getTicketById(id: string) {
    const ticket = await this.ticketModel
      .findOne({ _id: id, is_deleted: false })
      .populate('created_by', ['fullname', 'email'])
      .populate('assigned_to', ['fullname', 'email'])
      .populate('user_type', ['name'])
      .populate('messages')
      .exec();

    if (!ticket) {
      throw new NotFoundException({
        status: 'error',
        message: 'Ticket not found',
      });
    }

    return ticket;
  }

  async getTicketMessages(id: string, params: any) {
    const { page = 1, pageSize = 50 } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const messages = await this.ticketMessageModel
      .find({ ticket: id, is_deleted: false })
      .populate('sender', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: 1 })
      .exec();

    const count = await this.ticketMessageModel
      .countDocuments({ ticket: id, is_deleted: false })
      .exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      messages,
    };
  }

  async updateTicket(id: string, updateTicketDto: UpdateTicketDto) {
    const ticket = await this.ticketModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!ticket) {
      throw new NotFoundException({
        status: 'error',
        message: 'Ticket not found',
      });
    }

    const data: any = { ...updateTicketDto };
    for (const value in data) {
      if (data[value] !== undefined) {
        ticket[value] = data[value];
      }
    }

    await ticket.save();

    return {
      status: 'success',
      message: 'Ticket updated',
      data: ticket,
    };
  }

  async addTicketMessage(
    id: string,
    createTicketMessageDto: CreateTicketMessageDto,
    user: any,
  ) {
    const ticket = await this.ticketModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!ticket) {
      throw new NotFoundException({
        status: 'error',
        message: 'Ticket not found',
      });
    }

    if (ticket.status === 'closed') {
      throw new BadRequestException('Cannot add message to closed ticket');
    }

    const message = new this.ticketMessageModel({
      ...createTicketMessageDto,
      ticket: id,
      sender: user._id,
    });

    await message.save();

    // Send notification to ticket creator or assigned admin
    // const notifyUser = ticket.assigned_to || ticket.created_by;
    // await this.notificationService.sendMessage(
    //   { _id: notifyUser },
    //   'New Message on Ticket',
    //   `New message added to ticket ${ticket.ticket_number}`,
    //   ticket._id,
    // );

    return {
      status: 'success',
      message: 'Message added to ticket',
      data: { message },
    };
  }

  async assignTicket(id: string, assignedTo: string) {
    const ticket = await this.ticketModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!ticket) {
      throw new NotFoundException({
        status: 'error',
        message: 'Ticket not found',
      });
    }

    ticket.assigned_to = assignedTo;
    ticket.status = 'in_review';
    await ticket.save();

    return {
      status: 'success',
      message: 'Ticket assigned successfully',
      data: ticket,
    };
  }

  async closeTicket(id: string) {
    const ticket = await this.ticketModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!ticket) {
      throw new NotFoundException({
        status: 'error',
        message: 'Ticket not found',
      });
    }

    ticket.status = 'closed';
    ticket.date_closed = new Date();
    await ticket.save();

    // Send notification to ticket creator
    await this.notificationService.sendMessage({
      user: { _id: ticket.created_by },
      title: 'Ticket Closed',
      message: `Your ticket ${ticket.ticket_number} has been closed`,
      resource: 'ticket',
      resource_id: ticket._id.toString(),
    });

    return {
      status: 'success',
      message: 'Ticket closed successfully',
      data: ticket,
    };
  }

  async deleteTicket(id: string) {
    const ticket = await this.ticketModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!ticket) {
      throw new NotFoundException({
        status: 'error',
        message: 'Ticket not found',
      });
    }

    ticket.is_deleted = true;
    await ticket.save();

    return {
      status: 'success',
      message: 'Ticket deleted successfully',
    };
  }

  async getStatistics() {
    const statistics: any = {
      total_tickets: await this.ticketModel.countDocuments({
        is_deleted: false,
      }),
      total_open_tickets: await this.ticketModel.countDocuments({
        is_deleted: false,
        status: { $ne: 'closed' },
      }),
      total_pending_tickets: await this.ticketModel.countDocuments({
        is_deleted: false,
        status: 'pending',
      }),
      total_in_review_tickets: await this.ticketModel.countDocuments({
        is_deleted: false,
        status: 'in_review',
      }),

      total_resolved_tickets: await this.ticketModel.countDocuments({
        is_deleted: false,
        status: 'closed',
      }),
    };

    const averageResolutionTime = await this.ticketModel.aggregate([
      {
        $match: {
          is_deleted: false,
          status: 'closed',
          date_closed: { $ne: null },
        },
      },
      {
        $project: {
          resolution_time: {
            $subtract: ['$date_closed', '$createdAt'],
          },
        },
      },
      {
        $group: {
          _id: null,
          average_resolution_time: { $avg: '$resolution_time' },
        },
      },
      {
        $project: {
          average_resolution_time: {
            $divide: ['$average_resolution_time', 60000], // Convert milliseconds to minutes
          },
        },
      },
    ]);

    statistics.average_resolution_time =
      averageResolutionTime[0]?.average_resolution_time || 0;

    return {
      status: 'success',
      message: 'Statistics fetched successfully',
      data: statistics,
    };
  }
}
