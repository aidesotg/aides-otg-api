import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MiscCLass } from 'src/services/misc.service';
import { Mailer } from 'src/services/mailer.service';
import { InsuranceCompany } from 'src/modules/insurance-company/interface/insurance-comapny.interface';
import { CreateInsuranceCompanyDto } from 'src/modules/insurance-company/dto/create-insurance.dto';

@Injectable()
export class InsuranceCompanyService {
  constructor(
    @InjectModel('InsuranceCompany')
    private readonly insuranceCompanyModel: Model<InsuranceCompany>,
    private miscService: MiscCLass,
  ) {}

  private async generateInsuranceId() {
    const insuranceId = await this.insuranceCompanyModel.countDocuments({});
    return `INS-${insuranceId + 1}`;
  }

  async createIncuranceCompany(
    createInsuranceCompanyDto: CreateInsuranceCompanyDto,
  ) {
    const insuranceCompany = new this.insuranceCompanyModel({
      ...createInsuranceCompanyDto,
      insurance_id: await this.generateInsuranceId(),
    });
    await insuranceCompany.save();
    return {
      status: 'success',
      message: 'Insurance company created successfully',
      data: { insuranceCompany },
    };
  }

  async getInsurancesCompanies(params: any) {
    const { page = 1, pageSize = 50, search, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);

    if (search) {
      if (await this.miscService.IsObjectId(search)) {
        query._id = search;
      } else {
        query['$or'] = [{ name: await this.miscService.globalSearch(search) }];
      }
    }
    const insurances = await this.insuranceCompanyModel
      .find(query)
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.insuranceCompanyModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      insurances,
    };
  }

  async getInsuranceCompanyById(id: string) {
    const insurance = await this.insuranceCompanyModel
      .findOne({ _id: id })
      .exec();

    if (!insurance) {
      throw new NotFoundException({
        status: 'error',
        message: 'Insurance Company not found',
      });
    }

    return insurance;
  }

  async updateInsuranceCompany(
    id: string,
    updateInsuranceDto: Partial<CreateInsuranceCompanyDto>,
  ) {
    const insuranceCompany = await this.getInsuranceCompanyById(id);

    const data: any = { ...updateInsuranceDto };
    for (const value in data) {
      if (data[value] !== undefined) {
        insuranceCompany[value] = data[value];
      }
    }

    await insuranceCompany.save();

    return {
      status: 'success',
      message: 'Insurance updated',
      data: { insuranceCompany },
    };
  }

  async activateInsuranceCompany(id: string) {
    const insuranceCompany = await this.getInsuranceCompanyById(id);
    const status = insuranceCompany.status;
    insuranceCompany.status = status === 'active' ? 'suspended' : 'active';
    await insuranceCompany.save();

    return {
      status: 'success',
      message: `Insurance Company ${
        insuranceCompany.status === 'active' ? 'activated' : 'suspended'
      } successfully`,
      data: insuranceCompany,
    };
  }

  async deleteInsurance(id: string) {
    const insuranceCompany = await this.getInsuranceCompanyById(id);

    await insuranceCompany.deleteOne();

    return {
      status: 'success',
      message: 'Insurance Company deleted successfully',
    };
  }
}
