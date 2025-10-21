import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseFilters,
  Query,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceCategoryService } from './service-category.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateServiceCategoryDto,
  UpdateServiceCategoryDto,
} from './dto/service-category.dto';

@ApiTags('service-category')
@Controller('service-category')
export class ServiceCategoryController {
  constructor(
    private readonly serviceCategoryService: ServiceCategoryService,
  ) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getServiceCategories(@Query() params: any) {
    const categories = await this.serviceCategoryService.getServiceCategories(
      params,
    );
    return {
      status: 'success',
      message: 'Service categories fetched',
      data: categories,
    };
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getServiceCategoryById(@Param('id') id: string) {
    const category = await this.serviceCategoryService.getServiceCategoryById(
      id,
    );
    return {
      status: 'success',
      message: 'Service category fetched',
      data: { category },
    };
  }

  @Post('/create')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createServiceCategory(
    @Body() body: CreateServiceCategoryDto,
    @AuthUser() user: any,
  ) {
    return this.serviceCategoryService.createServiceCategory(body, user);
  }

  @Put('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateServiceCategory(
    @Param('id') id: string,
    @Body() body: UpdateServiceCategoryDto,
  ) {
    return this.serviceCategoryService.updateServiceCategory(id, body);
  }

  @Put('/:id/toggle-status')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async suspendServiceCategory(@Param('id') id: string) {
    return this.serviceCategoryService.suspendServiceCategory(id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteServiceCategory(@Param('id') id: string) {
    return this.serviceCategoryService.deleteServiceCategory(id);
  }
}
