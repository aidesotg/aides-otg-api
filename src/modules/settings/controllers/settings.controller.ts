import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { SettingsService } from '../services/settings.service';
import { CreateSettingDto } from '../dto/create-setting.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingService: SettingsService) {}

  @Post('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async create(@Body() body: CreateSettingDto) {
    return this.settingService.create(body);
  }

  @Put('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async update(@Body() body: CreateSettingDto) {
    return this.settingService.update(body);
  }

  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getSettings() {
    const setting = await this.settingService.getSettings();
    // return {
    //   status: 'success',
    //   message: 'settings created successfully',
    //   data: setting,
    // };
    return setting;
  }
}
