import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceCategory } from 'src/modules/service-category/interface/service-category.interface';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from 'src/modules/service-category/dto/service-category.dto';
import { MiscCLass } from 'src/services/misc.service';

@Injectable()
export class ServiceCategoryService {
  constructor(
    @InjectModel('ServiceCategory')
    private readonly serviceCategoryModel: Model<ServiceCategory>,
    private miscService: MiscCLass,
  ) {}

  private async validateServiceCategory(
    serviceCategory: CreateServiceCategoryDto,
  ) {
    const category = await this.serviceCategoryModel.findOne({
      title: serviceCategory.title,
    });
    if (category) {
      throw new BadRequestException({
        status: 'error',
        message: 'Service category already exists',
      });
    }
    return category;
  }

  async createServiceCategory(
    createServiceCategoryDto: CreateServiceCategoryDto,
    user: any,
  ) {
    await this.validateServiceCategory(createServiceCategoryDto);
    const data = {
      ...createServiceCategoryDto,
      created_by: user._id,
    };

    const newCategory = new this.serviceCategoryModel(data);
    const category = await newCategory.save();

    return {
      status: 'success',
      message: 'Service category created',
      data: category,
    };
  }

  async getServiceCategories(params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    // query.is_deleted = false;

    const categories = await this.serviceCategoryModel
      .find(query)
      .populate('no_of_services')
      // .populate('created_by', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.serviceCategoryModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      categories,
    };
  }

  async getServiceCategoryById(id: string) {
    const category = await this.serviceCategoryModel
      .findOne({ _id: id, is_deleted: false })
      .populate('created_by', ['fullname', 'email'])
      .populate('no_of_services')
      .exec();

    if (!category) {
      throw new NotFoundException({
        status: 'error',
        message: 'Service category not found',
      });
    }

    return category;
  }

  async updateServiceCategory(
    id: string,
    updateServiceCategoryDto: CreateServiceCategoryDto,
  ) {
    await this.validateServiceCategory(updateServiceCategoryDto);
    const category = await this.serviceCategoryModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!category) {
      throw new NotFoundException({
        status: 'error',
        message: 'Service category not found',
      });
    }

    const data: any = { ...updateServiceCategoryDto };
    for (const value in data) {
      if (data[value] !== undefined) {
        category[value] = data[value];
      }
    }

    await category.save();

    return {
      status: 'success',
      message: 'Service category updated',
      data: category,
    };
  }

  async suspendServiceCategory(id: string) {
    const category = await this.getServiceCategoryById(id);
    const status = category.status;
    category.status = status === 'active' ? 'suspended' : 'active';
    await category.save();

    return {
      status: 'success',
      message: `Service category ${
        category.status === 'active' ? 'activated' : 'suspended'
      } successfully`,
      data: category,
    };
  }

  async deleteServiceCategory(id: string) {
    const category = await this.getServiceCategoryById(id);
    category.is_deleted = true;
    await category.save();

    return {
      status: 'success',
      message: 'Service category deleted successfully',
    };
  }
}
