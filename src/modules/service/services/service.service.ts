import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service } from 'src/modules/service/interface/service.interface';
import {
  CreateServiceDto,
  UpdateServiceDto,
} from 'src/modules/service/dto/service.dto';
import { MiscCLass } from 'src/services/misc.service';

@Injectable()
export class ServiceService {
  constructor(
    @InjectModel('Service')
    private readonly serviceModel: Model<Service>,
    private miscService: MiscCLass,
  ) {}

  async createService(createServiceDto: CreateServiceDto, user: any) {
    const data = {
      ...createServiceDto,
      created_by: user._id,
    };
    console.log('🚀 ~ ServiceService ~ createService ~ data:', data);

    const newService = new this.serviceModel(data);
    const service = await newService.save();

    return {
      status: 'success',
      message: 'Service created',
      data: service,
    };
  }

  async getServices(params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    // query.is_deleted = false;

    const services = await this.serviceModel
      .find(query)
      .populate('category', ['title'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.serviceModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: services,
    };
  }

  async getServiceById(id: string) {
    const service = await this.serviceModel
      .findOne({ _id: id })

      .populate('category', ['title'])
      .exec();

    if (!service) {
      throw new NotFoundException({
        status: 'error',
        message: 'Service not found',
      });
    }

    return service;
  }

  async updateService(id: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.getServiceById(id);

    const data: any = { ...updateServiceDto };
    for (const value in data) {
      if (data[value] !== undefined) {
        service[value] = data[value];
      }
    }

    await service.save();

    return {
      status: 'success',
      message: 'Service updated',
      data: service,
    };
  }

  async suspendService(id: string) {
    const service = await this.getServiceById(id);
    const status = service.status;
    service.status = status === 'active' ? 'suspended' : 'active';
    await service.save();

    return {
      status: 'success',
      message: `Service ${
        service.status === 'active' ? 'activated' : 'suspended'
      } successfully`,
      data: service,
    };
  }

  async deleteService(id: string) {
    const service = await this.getServiceById(id);
    await service.deleteOne();

    return {
      status: 'success',
      message: 'Service deleted successfully',
    };
  }
}
