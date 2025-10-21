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
import { ServiceService } from './service.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { AddFavoriteDto } from '../service-request/dto/favorite.dto';

@ApiTags('service')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get('/list')
  @UseGuards(AuthGuard('jwt'))
  async getServices(@Query() params: any) {
    const services = await this.serviceService.getServices(params);
    return {
      status: 'success',
      message: 'Services fetched',
      data: services,
    };
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getServiceCategoryById(@Param('id') id: string) {
    const service = await this.serviceService.getServiceById(id);
    return {
      status: 'success',
      message: 'Service fetched',
      data: service,
    };
  }

  @Post('/create')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createServiceCategory(
    @Body() body: CreateServiceDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.createService(body, user);
  }

  @Put('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateService(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.serviceService.updateService(id, body);
  }

  @Put('/:id/toggle-status')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async suspendService(@Param('id') id: string) {
    return this.serviceService.suspendService(id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteService(@Param('id') id: string) {
    return this.serviceService.deleteService(id);
  }
}
