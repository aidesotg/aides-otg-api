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
import { AddFavoriteDto } from './dto/favorite.dto';

@ApiTags('service')
@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getServices(@Query() params: any) {
    const services = await this.serviceService.getServices(params);
    return {
      status: 'success',
      message: 'Services fetched',
      data: services,
    };
  }

  @Get('/my-requests')
  @UseGuards(AuthGuard('jwt'))
  async getMyRequests(@AuthUser() user: any, @Query() params: any) {
    return this.serviceService.getServices(params, user);
  }
  @Get('/active-requests')
  @UseGuards(AuthGuard('jwt'))
  async getActiveRequests(@AuthUser() user: any, @Query() params: any) {
    return this.serviceService.getActiveServices(params, user);
  }

  @Get('/my-requests/:id')
  @UseGuards(AuthGuard('jwt'))
  async getMyRequestById(@Param('id') id: string) {
    const service = await this.serviceService.getServiceById(id);
    return {
      status: 'success',
      message: 'Service fetched',
      data: service,
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
    const service = await this.serviceService.getServiceById(id);
    return {
      status: 'success',
      message: 'Service fetched',
      data: { service },
    };
  }

  @Post('')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createService(@Body() body: CreateServiceDto, @AuthUser() user: any) {
    return this.serviceService.createService(body, user);
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
  async updateService(
    @Param('id') id: string,
    @Body() body: UpdateServiceDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.updateService(id, body, user);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteService(@Param('id') id: string, @AuthUser() user: any) {
    return this.serviceService.deleteService(id, user);
  }

  @Delete('/favorites/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async removeFavorite(@Param('id') id: string, @AuthUser() user: any) {
    return this.serviceService.removeFavorite(id, user);
  }
}
