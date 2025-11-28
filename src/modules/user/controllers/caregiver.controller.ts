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
import { UserService } from '../services/user.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateProfessionalProfileDto,
  UpdateProfessionalProfileDto,
} from '../dto/professional-profile.dto';
import { CaregiverService } from '../services/caregiver.service';
import { UpdateApplicationStatusDto } from '../dto/update-application-status.dto';
import { User } from '../interface/user.interface';

@ApiTags('user/caregiver')
@Controller('user/caregiver')
export class CaregiverController {
  constructor(private readonly caregiverService: CaregiverService) {}
  @Get('/list')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getCaregivers(@Query() params: any, @AuthUser() user: any) {
    return this.caregiverService.getCaregivers(params, user);
  }

  @Get('/profile')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getProfessionalProfile(@AuthUser() user: any) {
    return this.caregiverService.getProfessionalProfile(user);
  }

  @Get('/reviews')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getReviews(@Query() params: any, @AuthUser() user: any) {
    return this.caregiverService.getCaregiverReviews(params, user);
  }

  @Get('/performance-metrics')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getPerformanceMetrics(@AuthUser() user: any) {
    return this.caregiverService.getPerformanceMetrics(user);
  }

  @Get('/applications/pending')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getPendingCaregiverApplications(
    @Query() params: any,
    @AuthUser() user: any,
  ) {
    return this.caregiverService.getCaregiverApplications({
      ...params,
      status: 'pending',
    });
  }

  @Get('/applications/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getCaregiverApplications(@Query() params: any, @AuthUser() user: any) {
    return this.caregiverService.getCaregiverApplications(params);
  }

  @Get('/applications/counts')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getApplicationCounts() {
    return this.caregiverService.getApplicationCounts();
  }

  @Get('/applications/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getSingleCaregiverApplication(@Param('id') id: string) {
    const application =
      await this.caregiverService.getSingleCaregiverApplication(id);
    return {
      status: 'success',
      message: 'Caregiver application fetched',
      data: application,
    };
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getCaregiverById(@Param('id') id: string, @AuthUser() user: any) {
    const caregiver = await this.caregiverService.getCaregiverById(id, user);
    return {
      status: 'success',
      message: 'Caregiver fetched',
      data: caregiver,
    };
  }

  @Get('/:id/reviews')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getCaregiverReviews(@Param('id') id: string, @Query() params: any) {
    return this.caregiverService.getCaregiverReviews(params, {
      _id: id,
    } as User);
  }

  @Post('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createProfessionalProfile(
    @Body() body: CreateProfessionalProfileDto,
    @AuthUser() user: any,
  ) {
    return this.caregiverService.createProfessionalProfile(body, user);
  }

  @Put('/profile')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateProfessionalProfile(
    @Body() body: UpdateProfessionalProfileDto,
    @AuthUser() user: any,
  ) {
    return this.caregiverService.updateProfessionalProfile(body, user);
  }
  @Put('/profile/:id/suspend')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async suspendCaregiver(
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.caregiverService.suspendCaregiver(id, body.reason);
  }

  @Put('/profile/:id/unsuspend')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async unsuspendCaregiver(@Param('id') id: string) {
    return this.caregiverService.unsuspendCaregiver(id);
  }

  @Put('/application/:id/status')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateCaregiverApplicationStatus(
    @Param('id') id: string,
    @Body() body: UpdateApplicationStatusDto,
    @AuthUser() user: any,
  ) {
    return this.caregiverService.updateCaregiverApplicationStatus(id, body);
  }
}
