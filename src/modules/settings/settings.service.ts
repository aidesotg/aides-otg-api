import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateSettingDto } from './dto/create-setting.dto';
import { Setting } from './interface/setting.interface';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel('Setting') private readonly settingModel: Model<Setting>,
  ) {}

  async create(body: CreateSettingDto) {
    const newSetting = new this.settingModel(body);
    await newSetting.save();

    return {
      status: 'success',
      message: 'settings created successfully',
    };
  }

  async getSettings() {
    const setting = await this.settingModel.findOne();

    if (!setting) {
      throw new NotFoundException({
        status: 'error',
        message: 'settings not found',
      });
    }
    const { id, ...rest } = setting.toObject();
    return {
      id,
      options: rest,
    };
  }

  async update(body: CreateSettingDto) {
    const setting = await this.settingModel.findOne();

    if (!setting) {
      throw new NotFoundException({
        status: 'error',
        message: 'settings not found',
      });
    }

    for (const value in body) {
      setting[value] = body[value];
    }

    await setting.save();

    return {
      status: 'success',
      message: 'settings updated successfully',
      data: setting,
    };
  }
}
