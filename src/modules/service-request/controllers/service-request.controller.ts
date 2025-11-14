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
  Headers,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServiceRequestService } from '../services/service-request.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  UpdateLocationDto,
  NearbyCaregiversQueryDto,
} from '../dto/service-request.dto';
import { AddFavoriteDto } from '../dto/favorite.dto';
import { AcceptRequestDto } from '../dto/accept-request.dto';
import { UpdateActivityTrailDto } from '../dto/activity-trail.dto';
import { CancelRequestDto } from '../dto/cancel-request.dto';
import { AddReviewDto } from '../dto/add-review.dto';

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

  @Get('/pool')
  @UseGuards(AuthGuard('jwt'))
  async getPoolRequests(@AuthUser() user: any, @Query() params: any) {
    return this.serviceService.getRequests({ ...params, status: 'Pending' });
  }

  @Get('/pending')
  @UseGuards(AuthGuard('jwt'))
  async getPendingRequests(@AuthUser() user: any, @Query() params: any) {
    return this.serviceService.getRequests(params);
  }

  @Get('/caregiver/pending')
  @UseGuards(AuthGuard('jwt'))
  async getCaregiverPendingRequests(
    @AuthUser() user: any,
    @Query() params: any,
  ) {
    return this.serviceService.getCaregiverSchedule(
      { ...params, status: 'Pending' },
      user,
    );
  }

  @Get('/schedule')
  @UseGuards(AuthGuard('jwt'))
  async getSchedule(@AuthUser() user: any, @Query() params: any) {
    return this.serviceService.getCaregiverSchedule(params, user);
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

  @Get('/reviews')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getReviews(@Query() params: any, @AuthUser() user: any) {
    return this.serviceService.getReviews(params, user);
  }

  @Get('/reviews/caregiver/:caregiverId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getCaregiverReviews(
    @Param('caregiverId') caregiverId: string,
    @Query() params: any,
    @AuthUser() user: any,
  ) {
    return this.serviceService.getReviews(
      { ...params, caregiver: caregiverId },
      user,
    );
  }

  @Get('/reviews/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getReviewById(@Param('id') id: string) {
    return this.serviceService.getReviewById(id);
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

  @Post('/reviews')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async addReview(@Body() body: AddReviewDto, @AuthUser() user: any) {
    return this.serviceService.addReview(body, user);
  }

  @Post('')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createServiceRequest(
    @Body() body: CreateServiceRequestDto,
    @AuthUser() user: any,
    @Headers('origin') origin: string,
  ) {
    return this.serviceService.initiateCreateServiceRequest(body, user, origin);
  }

  @Post('/favorites')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async addFavorite(@Body() body: AddFavoriteDto, @AuthUser() user: any) {
    return this.serviceService.addFavorite(body, user);
  }

  @Post('/:id/assign')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async assignCaregiverToRequest(
    @Param('id') id: string,
    @Body('caregiverId') caregiverId: string,
    @AuthUser() user: any,
  ) {
    return this.serviceService.assignCaregiverToRequest(id, caregiverId);
  }

  @Put('/caregiver/request/:id/respond')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async acceptServiceRequest(
    @Param('id') id: string,
    @Body() body: AcceptRequestDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.acceptServiceRequest(id, body, user);
  }

  @Put('/schedule/:id/activity-trail')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateActivityTrail(
    @Param('id') id: string,
    @Body() body: UpdateActivityTrailDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.updateActivityTrail(id, body, user);
  }

  @Put('/schedule/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async cancelServiceRequest(
    @Param('id') id: string,
    @Body() body: CancelRequestDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.cancelServiceRequest(id, body, user);
  }

  @Put('/:id/cancel/client')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async cancelServiceRequestByClient(
    @Param('id') id: string,
    @Body() body: CancelRequestDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.cancelServiceRequestByClient(id, body, user);
  }

  @Put('/:id/cancel')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async unassignCaregiverToRequest(
    @Param('id') id: string,
    @AuthUser() user: any,
    @Body() body: CancelRequestDto,
  ) {
    return this.serviceService.cancelServiceRequestAdmin(id, body, user);
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

  @Delete('/reviews/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteReview(@Param('id') id: string, @AuthUser() user: any) {
    return this.serviceService.deleteReview(id, user);
  }

  // Location tracking endpoints

  @Post('/caregiver/location')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateCaregiverLocation(
    @Body() body: UpdateLocationDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.updateCaregiverLocation(user._id, body);
  }

  @Get('/nearby-caregivers')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async findNearbyCaregivers(@Query() query: NearbyCaregiversQueryDto) {
    const { latitude, longitude, radius } = query;

    if (!latitude || !longitude) {
      return {
        status: 'error',
        message: 'latitude and longitude are required',
      };
    }

    return this.serviceService.findNearbyCaregivers(
      latitude,
      longitude,
      radius || 10,
    );
  }

  @Get('/request/:id/nearby-caregivers')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async findCaregiversNearRequest(
    @Param('id') id: string,
    @Query('radius') radius?: number,
  ) {
    return this.serviceService.findCaregiversNearRequest(id, radius || 10);
  }

  @Get('/request/:id/distance/:caregiverId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getCaregiverDistance(
    @Param('id') id: string,
    @Param('caregiverId') caregiverId: string,
  ) {
    return this.serviceService.getCaregiverDistance(id, caregiverId);
  }

  @Post('/request/:id/location')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateRequestLocation(
    @Param('id') id: string,
    @Body() body: UpdateLocationDto,
    @AuthUser() user: any,
  ) {
    return this.serviceService.updateRequestLocation(id, body);
  }
}
