import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Insurance } from './interface/insurance.interface';
import { MiscCLass } from 'src/services/misc.service';
import { UserService } from 'src/modules/user/user.service';
import { Mailer } from 'src/services/mailer.service';
import AccountCreationMail from 'src/services/mailers/templates/account-registration.mail';
import constants from 'src/framework/constants';
import { InsuranceInfoDto } from './dto/insurance.dto';
import { User } from '../user/interface/user.interface';

@Injectable()
export class InsuranceService {
  constructor(
    @InjectModel('Insurance') private readonly insuranceModel: Model<Insurance>,
    private miscService: MiscCLass,
    private mailerService: Mailer,
  ) {}

  async verifyExistingInsurance(policy_number: string) {
    const existingInsurance = await this.insuranceModel.findOne({
      policy_number: policy_number,
      is_deleted: false,
    });
    if (existingInsurance) {
      return true;
    }
    return false;
  }

  async getInsurances(params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    query.is_deleted = false;

    const insurances = await this.insuranceModel
      .find(query)
      .populate('user', ['first_name', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.insuranceModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      insurances,
    };
  }

  async getInsuranceById(id: string) {
    const insurance = await this.insuranceModel
      .findOne({ _id: id, is_deleted: false })
      .populate('user', ['first_name', 'email'])
      .populate('transactions')
      .populate('beneficiary')
      .exec();

    if (!insurance) {
      throw new NotFoundException({
        status: 'error',
        message: 'Insurance not found',
      });
    }

    return insurance;
  }

  async getInsuranceTransactions(id: string, params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    // This would need to be implemented when Transaction module is created
    // For now, return empty result
    return {
      pagination: {
        ...(await this.miscService.pageCount({ count: 0, page, pageSize })),
        total: 0,
      },
      transactions: [],
    };
  }

  async updateInsurance(
    id: string,
    updateInsuranceDto: Partial<InsuranceInfoDto>,
  ) {
    const insurance = await this.insuranceModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!insurance) {
      throw new NotFoundException({
        status: 'error',
        message: 'Insurance not found',
      });
    }

    const data: any = { ...updateInsuranceDto };
    for (const value in data) {
      if (data[value] !== undefined) {
        insurance[value] = data[value];
      }
    }

    await insurance.save();

    return {
      status: 'success',
      message: 'Insurance updated',
      data: { insurance },
    };
  }

  async updateUserInsurance(
    user: User,
    updateInsuranceDto: Partial<InsuranceInfoDto>,
  ) {
    const insurance = await this.insuranceModel
      .findOne({ user: user._id })
      .exec();

    if (!insurance) {
      throw new NotFoundException({
        status: 'error',
        message: 'Insurance not found',
      });
    }

    const data: any = { ...updateInsuranceDto };
    for (const value in data) {
      if (data[value] !== undefined) {
        insurance[value] = data[value];
      }
    }

    await insurance.save();

    return {
      status: 'success',
      message: 'Insurance updated',
      data: { insurance },
    };
  }

  async activateInsurance(id: string) {
    const insurance = await this.getInsuranceById(id);
    insurance.is_active = true;
    await insurance.save();

    return {
      status: 'success',
      message: 'Insurance activated successfully',
    };
  }

  async deactivateInsurance(id: string) {
    const insurance = await this.getInsuranceById(id);
    insurance.is_active = false;
    await insurance.save();

    return {
      status: 'success',
      message: 'Insurance deactivated successfully',
    };
  }

  async deleteInsurance(id: string) {
    const insurance = await this.getInsuranceById(id);
    insurance.is_deleted = true;
    await insurance.save();

    return {
      status: 'success',
      message: 'Insurance deleted successfully',
    };
  }
}
