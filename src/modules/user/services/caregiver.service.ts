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
import { Beneficiary } from '../interface/beneficiary.interface';
import { Insurance } from 'src/modules/insurance/interface/insurance.interface';
import { InsuranceService } from 'src/modules/insurance/services/insurance.service';
import { UserBeneficiary } from '../interface/user-beneficiary.interface';
import { WalletService } from 'src/modules/wallet/services/wallet.service';
import { Wallet } from '../../wallet/interface/wallet.interface';
import {
  CreateProfessionalProfileDto,
  UpdateProfessionalProfileDto,
} from '../dto/professional-profile.dto';
import { ProfessionalProfile } from '../interface/professional-profile.interface';
import { UserService } from './user.service';
import { Bank } from '../interface/bank.interface';
import { Review } from 'src/modules/service-request/interface/review.interface';
import { ServiceRequest } from 'src/modules/service-request/interface/service-request-interface.interface';

@Injectable()
export class CaregiverService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Review') private readonly reviewModel: Model<Review>,
    @InjectModel('Beneficiary')
    private readonly beneficiaryModel: Model<Beneficiary>,
    @InjectModel('Insurance') private readonly insuranceModel: Model<Insurance>,
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
    @InjectModel('UserBeneficiary')
    private readonly userBeneficiaryModel: Model<UserBeneficiary>,
    @InjectModel('Bank') private readonly bankModel: Model<Bank>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
    @InjectModel('ProfessionalProfile')
    private readonly professionalProfileModel: Model<ProfessionalProfile>,
    private notificationService: NotificationService,
    private userService: UserService,
    private miscService: MiscCLass,
    @Inject(forwardRef(() => InsuranceService))
    private insuranceService: InsuranceService,

    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  private async generateProfileId(
    professionalProfile: ProfessionalProfile,
  ): Promise<string> {
    return `Pid${professionalProfile._id.toString().toUpperCase().slice(-10)}`;
  }

  //PROFESSIONAL PROFILE
  async createProfessionalProfile(
    createProfessionalProfileDto: CreateProfessionalProfileDto,
    user: User,
  ) {
    const { professional_profile, ...rest } = createProfessionalProfileDto;
    const profile = await this.professionalProfileModel.findOne({
      user: user._id,
    });
    if (profile && profile.status !== 'pending') {
      throw new BadRequestException({
        status: 'error',
        message:
          'You currently have a pending Caregiver Application pending review',
      });
    }

    const { payout, ...profileData } = professional_profile;
    const professionalProfile = new this.professionalProfileModel({
      ...profileData,
      status: 'pending',
      user: user._id,
    });
    professionalProfile.profile_id = await this.generateProfileId(
      professionalProfile,
    );
    await professionalProfile.save();

    if (payout) {
      const bank = new this.bankModel({
        ...payout,
        user: user._id,
      });
      await bank.save();
    }

    await this.userService.updateProfile(rest, user);
    return {
      status: 'success',
      message: 'Application under review',
      data: professionalProfile,
    };
  }

  async updateProfessionalProfile(
    updateProfessionalProfileDto: UpdateProfessionalProfileDto,
    user: User,
  ) {
    const profile = await this.professionalProfileModel.findOne({
      user: user._id,
    });
    if (!profile) {
      throw new NotFoundException({
        status: 'error',
        message: 'Professional profile not found',
      });
    }
    for (const value in updateProfessionalProfileDto) {
      if (value) {
        profile[value] = updateProfessionalProfileDto[value];
      }
    }
    await profile.save();
    return {
      status: 'success',
      message: 'Professional profile updated successfully',
      data: profile,
    };
  }

  async getProfessionalProfile(user: User) {
    const profile = await this.professionalProfileModel.findOne({
      user: user._id,
    });
    return {
      status: 'success',
      message: 'Professional profile fetched',
      data: profile,
    };
  }

  async getCaregiverReviews(params: any, user: User) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    query.care_giver = user._id;
    const reviews = await this.reviewModel
      .find(query)
      .populate('request')
      .populate('user', ['first_name', 'last_name', 'profile_picture'])
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 });
    const count = await this.reviewModel.countDocuments(query).exec();
    return {
      status: 'success',
      message: 'Caregiver reviews fetched',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: reviews,
    };
  }

  async getPerformanceMetrics(user: User) {
    const count = await this.reviewModel.countDocuments({
      care_giver: user._id,
    });
    const ratings = await this.reviewModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: ['$care_giver', { $toObjectId: user._id }],
          },
        },
      },
      { $sort: { rating: -1, _id: 1 } },
      {
        $group: {
          _id: '$rating',
          count: { $count: {} },
        },
      },
    ]);

    const ratingByPercentage: any = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };
    if (ratings.length) {
      for (const rate of ratings) {
        ratingByPercentage[rate._id] = (rate.count / count) * 100;
      }
    }
    // ratingByPercentage.total = count;

    const average = await this.reviewModel.aggregate([
      {
        $match: {
          $expr: {
            $eq: ['$care_giver', { $toObjectId: user._id }],
          },
        },
      },
      {
        $group: {
          _id: 'average_rating',
          average: { $avg: '$rating' },
        },
      },
    ]);

    const completedRequests = await this.serviceRequestModel.countDocuments({
      care_giver: user._id,
      status: 'Completed',
    });
    const cancelledRequests = await this.serviceRequestModel.countDocuments({
      care_giver: user._id,
      status: 'Cancelled',
    });
    const acceptedRequests = await this.serviceRequestModel.countDocuments({
      care_giver: user._id,
      status: 'Accepted',
    });
    const totalRequests = await this.serviceRequestModel.countDocuments({
      care_giver: user._id,
    });

    return {
      status: 'success',
      message: 'Performance metrics fetched',
      data: {
        rating: {
          overall_rating: average[0]?.average || 0,
          total_rating: count,
          ratingByPercentage,
        },
        reliability_score: {
          completed: (completedRequests / totalRequests) * 100,
          cancellation: (cancelledRequests / totalRequests) * 100,
          late_arrivals: 0,
          no_shows: 0,
        },
        session_completion: {
          accepted: acceptedRequests,
          completed: completedRequests,
        },
      },
    };
  }
}
