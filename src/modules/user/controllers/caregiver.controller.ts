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

@ApiTags('user/caregiver')
@Controller('user/caregiver')
export class CaregiverController {
  constructor(private readonly caregiverService: CaregiverService) {}

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
}
