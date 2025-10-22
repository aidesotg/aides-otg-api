import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceRequest } from './interface/service-request-interface.interface';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';
import { MiscCLass } from 'src/services/misc.service';
import { User } from '../user/interface/user.interface';
import { UserBeneficiary } from '../user/interface/user-beneficiary.interface';
import { ServiceRequestDayLogs } from './interface/service-request-day-logs.schema';
import { Favorite } from './interface/favorite.interface';
import { AddFavoriteDto } from './dto/favorite.dto';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
    @InjectModel('ServiceRequestDayLogs')
    private readonly serviceRequestDayLogsModel: Model<ServiceRequestDayLogs>,
    @InjectModel('UserBeneficiary')
    private readonly userBeneficiaryModel: Model<UserBeneficiary>,
    @InjectModel('Favorite') private readonly favoriteModel: Model<Favorite>,
    private miscService: MiscCLass,
  ) {}

  private generateBookingId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BKNG-${timestamp}-${random}`;
  }

  async createServiceRequest(
    createServiceDto: CreateServiceRequestDto,
    user: User,
  ) {
    const { beneficiary, date_list, ...rest } = createServiceDto;
    const isBeneficiary = await this.userBeneficiaryModel.findOne({
      beneficiary: beneficiary,
      user: user._id,
    });
    if (!isBeneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found for user',
      });
    }
    const dateList = date_list as any;
    for (const date of dateList) {
      if (new Date(date.date) < new Date()) {
        throw new BadRequestException({
          status: 'error',
          message: 'Dates in the date list cannot be in the past',
        });
      }
      date.day_of_week = await this.miscService.getDayOfWeek(
        date.date.toString(),
      );
    }
    const data = {
      ...createServiceDto,
      booking_id: this.generateBookingId(),
      date_list: dateList,
      created_by: user._id,
    };

    const newRequest = new this.serviceRequestModel(data);
    const request = await newRequest.save();

    //TODO: Send notification to care giver if care giver is passed

    return {
      status: 'success',
      message: 'Request created',
      data: request,
    };
  }

  async getRequests(params: any, user?: User) {
    console.log('🚀 ~ ServiceRequestService ~ getRequests ~ user:', user);
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    if (user) {
      query.created_by = user._id;
    }

    const requests = await this.serviceRequestModel
      .find(query)
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
      ])
      .populate('created_by', ['first_name', 'last_name', 'profile_picture'])
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.serviceRequestModel.countDocuments(query).exec();

    return {
      status: 'success',
      message: 'Requests fetched',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: requests,
    };
  }

  async getActiveRequests(params: any, user: User) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    if (user) {
      query.created_by = user._id;
    }

    query['$or'] = [
      { status: 'Pending' },
      { status: 'Accepted' },
      { status: 'In Progress' },
    ];
    delete query.status;

    const requests = await this.serviceRequestModel
      .find(query)
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
      ])
      .populate('created_by', ['first_name', 'last_name', 'profile_picture'])
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.serviceRequestModel.countDocuments(query).exec();

    return {
      status: 'success',
      message: 'Active requests fetched',

      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: requests,
    };
  }

  async getRequestById(id: string) {
    const request = await this.serviceRequestModel
      .findOne({ _id: id })
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
      ])
      .populate('created_by', ['first_name', 'last_name', 'profile_picture'])
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .lean()
      .exec();

    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Service not found',
      });
    }
    const dateList = request.date_list as any;
    for (const date of dateList) {
      const dayLogs = await this.serviceRequestDayLogsModel
        .findOne({
          service: request._id,
          day_id: date._id,
        })
        .select('log')
        .lean()
        .exec();

      date.day_logs = dayLogs?.log || [];
    }

    return {
      ...request,
      date_list: dateList,
    };
  }

  async updateServiceRequest(
    id: string,
    updateServiceRequestDto: UpdateServiceRequestDto,
    user: User,
  ) {
    const { beneficiary, date_list, ...rest } = updateServiceRequestDto;
    const service = await this.serviceRequestModel
      .findOne({ _id: id, created_by: user._id })
      .exec();

    if (!service) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }

    const data: any = { ...rest };

    if (beneficiary) {
      const isBeneficiary = await this.userBeneficiaryModel.findOne({
        beneficiary: beneficiary,
        user: user._id,
      });
      if (!isBeneficiary) {
        throw new NotFoundException({
          status: 'error',
          message: 'Beneficiary not found for user',
        });
      }
      data.beneficiary = beneficiary;
    }
    if (date_list && date_list.length > 0) {
      const dateList = date_list as any;
      for (const date of dateList) {
        if (new Date(date.date) < new Date()) {
          throw new BadRequestException({
            status: 'error',
            message: 'Dates in the date list cannot be in the past',
          });
        }
        date.day_of_week = await this.miscService.getDayOfWeek(
          date.date.toString(),
        );
      }
      data.date_list = dateList;
    }

    for (const value in data) {
      if (data[value] !== undefined) {
        service[value] = data[value];
      }
    }

    await service.save();

    return {
      status: 'success',
      message: 'Request updated',
      data: service,
    };
  }

  async deleteServiceRequest(id: string, user: User) {
    const request = await this.serviceRequestModel
      .findOne({ _id: id, created_by: user._id })
      .select('_id')
      .exec();
    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }
    await request.deleteOne();
    await this.serviceRequestDayLogsModel
      .deleteMany({ service: request._id })
      .exec();

    return {
      status: 'success',
      message: 'Request deleted successfully',
    };
  }

  async addFavorite(addFavoriteDto: AddFavoriteDto, user: User) {
    const favorite = new this.favoriteModel({
      request: addFavoriteDto.request,
      care_giver: addFavoriteDto.care_giver,
      user: user._id,
    });
    const newFavorite = await favorite.save();
    return {
      status: 'success',
      message: 'Favorite added successfully',
      data: newFavorite,
    };
  }

  async removeFavorite(id: string, user: any) {
    const favorite = await this.favoriteModel.findOne({
      _id: id,
      user: user._id,
    });
    if (!favorite) {
      throw new NotFoundException({
        status: 'error',
        message: 'Favorite not found',
      });
    }
    await favorite.deleteOne();
    return {
      status: 'success',
      message: 'Favorite removed successfully',
    };
  }
  async getFavorites(user: any) {
    const favorites = await this.favoriteModel
      .find({ user: user._id })
      .populate('request')
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .exec();
    return {
      status: 'success',
      message: 'Favorites retrieved successfully',
      data: favorites,
    };
  }
  async getFavoriteById(id: string) {
    const favorite = await this.favoriteModel
      .findOne({ _id: id })
      .populate('request', ['name', 'description', 'image'])
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .exec();
    if (!favorite) {
      throw new NotFoundException({
        status: 'error',
        message: 'Favorite not found',
      });
    }
    return {
      status: 'success',
      message: 'Favorite retrieved successfully',
      data: favorite,
    };
  }
}
