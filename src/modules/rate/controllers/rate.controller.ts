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
import { RateService } from 'src/modules/rate/services/rate.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateRateSettingsDto,
  UpdateRateSettingsDto,
} from 'src/modules/rate/dto/rate.dto';

@ApiTags('rate')
@Controller('rate')
export class RateController {
  constructor(private readonly rateService: RateService) {}

  @Get('/settings')
  @UseGuards(AuthGuard('jwt'))
  async getRateSettings() {
    const settings = await this.rateService.getRateSettings();
    return {
      status: 'success',
      message: 'Rate settings fetched',
      data: { settings },
    };
  }

  @Get('/settings/history')
  @UseGuards(AuthGuard('jwt'))
  async getRateSettingsHistory(@Query() params: any) {
    const history = await this.rateService.getRateSettingsHistory(params);
    return {
      status: 'success',
      message: 'Rate settings history fetched',
      data: history,
    };
  }

  @Post('/settings/create')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createRateSettings(
    @Body() body: CreateRateSettingsDto,
    @AuthUser() user: any,
  ) {
    return this.rateService.createRateSettings(body, user);
  }

  @Put('/settings/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateRateSettings(
    @Body() body: UpdateRateSettingsDto,
    @AuthUser() user: any,
  ) {
    return this.rateService.updateRateSettings(body, user);
  }

  @Put('/settings/activate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async activateRateSettings(@AuthUser() user: any) {
    return this.rateService.activateRateSettings(user);
  }

  @Put('/settings/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deactivateRateSettings(@AuthUser() user: any) {
    return this.rateService.deactivateRateSettings(user);
  }

  @Get('/calculate/:serviceId')
  @UseGuards(AuthGuard('jwt'))
  async calculateRates(
    @Param('serviceId') serviceId: string,
    @Query('amount') amount: string,
  ) {
    const calculation = await this.rateService.calculateRates(
      serviceId,
      parseFloat(amount),
    );
    return {
      status: 'success',
      message: 'Rate calculation completed',
      data: calculation,
    };
  }
}
