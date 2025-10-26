import {
  Injectable,
  NotFoundException,
  HttpException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../interface/user.interface';
import { Role } from 'src/modules/role/interface/role.interface';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { MiscCLass } from 'src/services/misc.service';
import { RoleService } from 'src/modules/role/services/role.service';
import { Mailer } from 'src/services/mailer.service';
import { Beneficiary } from '../interface/beneficiary.interface';
import { Insurance } from 'src/modules/insurance/interface/insurance.interface';
import { InsuranceService } from 'src/modules/insurance/services/insurance.service';
import { UserBeneficiary } from '../interface/user-beneficiary.interface';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '../dto/beneficiary.dto';
import { WalletService } from 'src/modules/wallet/services/wallet.service';
import { Wallet } from 'src/modules/wallet/interface/wallet.interface';
import { CreateProfessionalProfileDto } from '../dto/professional-profile.dto';
import { ProfessionalProfile } from '../interface/professional-profile.interface';

@Injectable()
export class BeneficiaryService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Beneficiary')
    private readonly beneficiaryModel: Model<Beneficiary>,
    @InjectModel('Insurance') private readonly insuranceModel: Model<Insurance>,
    @InjectModel('UserBeneficiary')
    private readonly userBeneficiaryModel: Model<UserBeneficiary>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
    @InjectModel('ProfessionalProfile')
    private readonly professionalProfileModel: Model<ProfessionalProfile>,
    private roleService: RoleService,
    private miscService: MiscCLass,
    private mailerService: Mailer,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => InsuranceService))
    private insuranceService: InsuranceService,

    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  private async generateBeneficiaryId(
    beneficiary: Beneficiary,
  ): Promise<string> {
    return `Bid${beneficiary._id.toString().toUpperCase().slice(-10)}`;
  }

  //BENEFICIARY
  async createBeneficiary(
    createBeneficiaryDto: CreateBeneficiaryDto[],
    user: User,
  ) {
    const beneficiariesData: any = [];
    const insuranceData: any = [];
    const userBeneficiaryData: any = [];

    for (const beneficiary of createBeneficiaryDto) {
      const { insurance, ...rest } = beneficiary;
      if (insurance) {
        const policyExists =
          await this.insuranceService.verifyExistingInsurance(
            insurance.policy_number,
          );
        if (policyExists) {
          throw new BadRequestException({
            status: 'error',
            message: `Beneficiary with Policy number: ${insurance.policy_number} already exists`,
          });
        }
      }
      const newBeneficiary = new this.beneficiaryModel({
        ...rest,
        user: user._id,
      });

      newBeneficiary.beneficiary_id = await this.generateBeneficiaryId(
        newBeneficiary,
      );
      beneficiariesData.push(newBeneficiary.save());

      if (insurance) {
        const newInsurance = new this.insuranceModel({
          ...insurance,
          beneficiary: newBeneficiary._id,
        });
        insuranceData.push(newInsurance.save());
      }

      const newUserBeneficiary = new this.userBeneficiaryModel({
        user: user._id,
        beneficiary: newBeneficiary._id,
      });
      userBeneficiaryData.push(newUserBeneficiary.save());
    }

    await Promise.all(beneficiariesData);
    await Promise.all(insuranceData);
    await Promise.all(userBeneficiaryData);

    return {
      status: 'success',
      message: 'Beneficiary created successfully',
    };
  }

  async updateBeneficiary(
    id: string,
    updateBeneficiaryDto: UpdateBeneficiaryDto,
    user: any,
  ) {
    const { insurance, ...rest } = updateBeneficiaryDto;
    const userBeneficiary = await this.userBeneficiaryModel.findOne({
      beneficiary: id,
      user: user._id,
    });
    if (!userBeneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found for user',
      });
    }
    const beneficiary = await this.beneficiaryModel.findOne({
      _id: id,
    });
    if (!beneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found',
      });
    }
    for (const value in rest) {
      if (value) {
        beneficiary[value] = updateBeneficiaryDto[value];
      }
    }
    await beneficiary.save();
    return {
      status: 'success',
      message: 'Beneficiary updated successfully',
      data: beneficiary,
    };
  }

  async getBeneficariesByUserId(userId: string) {
    const beneficiaryIds = await Promise.all(
      (
        await this.userBeneficiaryModel.find({ user: userId })
      ).map(async (beneficiary) => beneficiary.beneficiary),
    );
    const beneficiaries = await this.beneficiaryModel
      .find({
        _id: { $in: beneficiaryIds },
      })
      .populate({
        path: 'insurance',
        populate: {
          path: 'insurance_company',
          select: '-createdAt -updatedAt',
        },
      });
    return {
      status: 'success',
      message: 'Beneficiaries fetched successfully',
      data: beneficiaries,
    };
  }

  async getBeneficiaries(params?: any) {
    const { page = 1, pageSize = 50, role, ownerId, ...rest } = params;

    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = await this.miscService.search(rest);

    if (ownerId) {
      const beneficiaryIds = await Promise.all(
        (
          await this.userBeneficiaryModel.find({ user: ownerId })
        ).map(async (beneficiary) => beneficiary.beneficiary),
      );
      query._id = { $in: beneficiaryIds };
    }

    const beneficiaries = await this.beneficiaryModel
      .find(query)
      .populate({
        path: 'owner',
        populate: {
          path: 'user',
          select: 'first_name last_name email',
        },
      })
      .populate({
        path: 'insurance',
        populate: {
          path: 'insurance_company',
          select: '-createdAt -updatedAt',
        },
      })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.beneficiaryModel.countDocuments(query).exec();

    if (!beneficiaries) {
      throw new HttpException(
        { status: 'error', message: 'User not found' },
        404,
      );
    }
    return {
      status: 'success',
      message: 'Beneficiaries fetched successfully',
      data: {
        pagination: {
          ...(await this.miscService.pageCount({ count, page, pageSize })),
          total: count,
        },
        data: beneficiaries,
      },
    };
  }

  async getBeneficaryById(beneficiaryId: string) {
    const beneficiary = await this.beneficiaryModel
      .findById(beneficiaryId)
      .populate({
        path: 'insurance',
        populate: {
          path: 'insurance_company',
          select: '-createdAt -updatedAt',
        },
      });
    if (!beneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found',
      });
    }
    return {
      status: 'success',
      message: 'Beneficiary fetched successfully',
      data: beneficiary,
    };
  }

  async getBeneficaryByEmail(email: string) {
    const beneficiary = await this.beneficiaryModel.findOne({
      email: email,
      is_deleted: false,
    });
    return beneficiary;
  }

  async deleteBeneficiary(id: string, user: any) {
    const userBeneficiary = await this.userBeneficiaryModel.findOne({
      beneficiary: id,
      user: user._id,
    });
    if (!userBeneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found for user',
      });
    }
    await this.userBeneficiaryModel.deleteOne({
      user: user._id,
      beneficiary: id,
    });
    await this.beneficiaryModel.deleteOne({ _id: id });
    await this.insuranceModel.deleteOne({
      beneficiary: id,
      user: { $eq: null },
    });
    return {
      status: 'success',
      message: 'Beneficiary deleted successfully',
    };
  }

  async deleteBeneficiaryAdmin(id: string) {
    const beneficiary = await this.beneficiaryModel.findOne({
      _id: id,
    });
    if (!beneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found',
      });
    }
    await beneficiary.deleteOne();
    return {
      status: 'success',
      message: 'Beneficiary deleted successfully',
    };
  }

  //PROFESSIONAL PROFILE
  async createProfessionalProfile(
    createProfessionalProfileDto: CreateProfessionalProfileDto,
    user: User,
  ) {
    const profile = await this.professionalProfileModel.findOne({
      user: user._id,
    });
    if (profile && profile.status !== 'pending') {
      throw new BadRequestException({
        status: 'error',
        message:
          'Yo currently have a pending Caregiver Application, please wait for it to be approved/rejected before creating a new one',
      });
    }
    const professionalProfile = new this.professionalProfileModel({
      ...createProfessionalProfileDto,
      status: 'pending',
      user: user._id,
    });
    await professionalProfile.save();
    return {
      status: 'success',
      message: 'Professional profile created successfully',
      data: professionalProfile,
    };
  }
}
