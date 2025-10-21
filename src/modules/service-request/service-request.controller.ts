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
import { ServiceRequestService } from './service-request.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
} from './dto/service-request.dto';
import { AddFavoriteDto } from './dto/favorite.dto';

@ApiTags('service-request')
@Controller('service-request')
export class ServiceRequestController {
  constructor(private readonly serviceService: ServiceRequestService) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getServices(@Query() params: any) {
    const requests = await this.serviceService.getRequests(params);
    return {
      status: 'success',
      message: 'Requests fetched',
      data: requests,
    };
  }

  @Get('/my-requests')
  @UseGuards(AuthGuard('jwt'))
  async getMyRequests(@AuthUser() user: any, @Query() params: any) {
    return this.serviceService.getRequests(params, user);
  }
  @Get('/active-requests')
  @UseGuards(AuthGuard('jwt'))
  async getActiveRequests(@AuthUser() user: any, @Query() params: any) {
    return this.serviceService.getActiveRequests(params, user);
  }

  @Get('/my-requests/:id')
  @UseGuards(AuthGuard('jwt'))
  async getMyRequestById(@Param('id') id: string) {
    const request = await this.serviceService.getRequestById(id);
    return {
      status: 'success',
      message: 'Request fetched',
      data: request,
    };
  }

  @Get('/favorites')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getFavorites(@AuthUser() user: any) {
    return this.serviceService.getFavorites(user);
  }

  @Get('/favorites/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getFavoriteById(@Param('id') id: string) {
    return this.serviceService.getFavoriteById(id);
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getServiceById(@Param('id') id: string) {
    const request = await this.serviceService.getRequestById(id);
    return {
      status: 'success',
      message: 'Request fetched',
      data: request,
    };
  }

  @Post('')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createServiceRequest(
    @Body() body: CreateServiceRequestDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.createServiceRequest(body, user);
  }

  @Post('/favorites')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async addFavorite(@Body() body: AddFavoriteDto, @AuthUser() user: any) {
    return this.serviceService.addFavorite(body, user);
  }

  @Put('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateServiceRequest(
    @Param('id') id: string,
    @Body() body: UpdateServiceRequestDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.updateServiceRequest(id, body, user);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteServiceRequest(@Param('id') id: string, @AuthUser() user: any) {
    return this.serviceService.deleteServiceRequest(id, user);
  }

  @Delete('/favorites/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async removeFavorite(@Param('id') id: string, @AuthUser() user: any) {
    return this.serviceService.removeFavorite(id, user);
  }
}
