import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RateSettings } from 'src/modules/rate/interface/rate-settings.interface';
import {
  CreateRateSettingsDto,
  UpdateRateSettingsDto,
} from 'src/modules/rate/dto/rate.dto';
import { MiscCLass } from 'src/services/misc.service';
import { ServiceService } from 'src/modules/service/services/service.service';

@Injectable()
export class RateService {
  constructor(
    @InjectModel('RateSettings')
    private readonly rateSettingsModel: Model<RateSettings>,
    private miscService: MiscCLass,
    private serviceService: ServiceService,
  ) {}

  async getRateSettings() {
    let settings = await this.rateSettingsModel
      .findOne({ is_active: true, is_deleted: false })
      // .populate('created_by', ['fullname', 'email'])
      .exec();

    if (!settings) {
      // Create default settings if none exist
      settings = await this.createDefaultSettings();
    }

    return settings;
  }

  async createDefaultSettings() {
    const defaultSettings = new this.rateSettingsModel({
      platform_commission_percentage: 10,
      penalty_settings: {
        client_cancellation: {
          penalty_percentage: 20,
          caregiver_benefit_percentage: 50,
          max_cancellation_time_hours: 2,
        },
        caregiver_cancellation: {
          penalty_amount: 1000,
          max_cancellation_time_hours: 2,
          miss_appointment_penalty_percentage: 10,
        },
      },
      suspension_thresholds: {
        caregiver_max_cancellations: 3,
        client_max_cancellations: 10,
      },
      tax_percentage: 0,
      currency: 'USD',
      // created_by: 'system', // This would be the system user ID
    });

    return await defaultSettings.save();
  }

  async getRateSettingsHistory(params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = { is_deleted: false };

    if (rest.is_active !== undefined) query.is_active = rest.is_active;

    if (rest.start_date || rest.end_date) {
      query.createdAt = {};
      if (rest.start_date) query.createdAt.$gte = new Date(rest.start_date);
      if (rest.end_date) query.createdAt.$lte = new Date(rest.end_date);
    }

    const settings = await this.rateSettingsModel
      .find(query)
      .populate('created_by', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.rateSettingsModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      settings,
    };
  }

  async createRateSettings(
    createRateSettingsDto: CreateRateSettingsDto,
    user: any,
  ) {
    // Deactivate current active settings
    await this.rateSettingsModel.updateMany(
      { is_active: true },
      { is_active: false },
    );

    const data = {
      ...createRateSettingsDto,
      created_by: user._id,
    };

    const newSettings = new this.rateSettingsModel(data);
    const settings = await newSettings.save();

    return {
      status: 'success',
      message: 'Rate settings created',
      data: settings,
    };
  }

  async updateRateSettings(
    updateRateSettingsDto: UpdateRateSettingsDto,
    user: any,
  ) {
    const currentSettings = await this.getRateSettings();

    if (!currentSettings) {
      throw new NotFoundException({
        status: 'error',
        message: 'No active rate settings found',
      });
    }

    for (const value in updateRateSettingsDto) {
      currentSettings[value] = updateRateSettingsDto[value];
    }
    await currentSettings.save();

    return {
      status: 'success',
      message: 'Rate settings updated',
      data: currentSettings,
    };
  }

  async activateRateSettings(user: any) {
    const settings = await this.rateSettingsModel
      .findOne({ is_deleted: false })
      .sort({ createdAt: -1 })
      .exec();

    if (!settings) {
      throw new NotFoundException({
        status: 'error',
        message: 'No rate settings found',
      });
    }

    // Deactivate all other settings
    await this.rateSettingsModel.updateMany(
      { _id: { $ne: settings._id } },
      { is_active: false },
    );

    settings.is_active = true;
    await settings.save();

    return {
      status: 'success',
      message: 'Rate settings activated',
      data: settings,
    };
  }

  async deactivateRateSettings(user: any) {
    const settings = await this.getRateSettings();

    if (!settings) {
      throw new NotFoundException({
        status: 'error',
        message: 'No active rate settings found',
      });
    }

    settings.is_active = false;
    await settings.save();

    return {
      status: 'success',
      message: 'Rate settings deactivated',
    };
  }

  async calculateRates(serviceId: string, amount: number) {
    const service = await this.serviceService.getServiceById(serviceId);
    const settings = await this.getRateSettings();

    const platformCommission =
      (amount * settings.platform_commission_percentage) / 100;
    // const caregiverAmount = service.caregiver_commission;
    const netAmount = amount - platformCommission;

    return {
      service_amount: amount,
      platform_commission_percentage: settings.platform_commission_percentage,
      platform_commission_amount: platformCommission,
      // caregiver_amount: caregiverAmount,
      net_amount: netAmount,
      currency: settings.currency,
      penalty_settings: settings.penalty_settings,
    };
  }

  async calculateCancellationPenalty(
    cancellationType: 'client' | 'caregiver',
    amount: number,
  ) {
    const settings = await this.getRateSettings();

    if (cancellationType === 'client') {
      const penaltyAmount =
        (amount *
          settings.penalty_settings.client_cancellation.penalty_percentage) /
        100;
      const caregiverBenefit =
        (penaltyAmount *
          settings.penalty_settings.client_cancellation
            .caregiver_benefit_percentage) /
        100;
      const platformBenefit = penaltyAmount - caregiverBenefit;

      return {
        penalty_amount: penaltyAmount,
        caregiver_benefit: caregiverBenefit,
        platform_benefit: platformBenefit,
        max_cancellation_time_hours:
          settings.penalty_settings.client_cancellation
            .max_cancellation_time_hours,
      };
    } else {
      return {
        penalty_amount:
          settings.penalty_settings.caregiver_cancellation.penalty_amount,
        max_cancellation_time_hours:
          settings.penalty_settings.caregiver_cancellation
            .max_cancellation_time_hours,
      };
    }
  }

  async checkSuspensionThreshold(
    userId: string,
    userType: 'caregiver' | 'client',
  ) {
    const settings = await this.getRateSettings();

    // This would need to be implemented with actual cancellation tracking
    // For now, return the thresholds
    return {
      max_cancellations:
        userType === 'caregiver'
          ? settings.suspension_thresholds.caregiver_max_cancellations
          : settings.suspension_thresholds.client_max_cancellations,
      current_cancellations: 0, // This would be fetched from actual data
    };
  }
}
