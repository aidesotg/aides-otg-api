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
import { ServiceRequest } from 'src/modules/service-request/interface/service-request.interface';
import constants from 'src/framework/constants';

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

  private async updateUserRole(user: string, role: string) {
    const userDetails = await this.userModel.findById(user);
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'User not found',
      });
    }
    if (!userDetails.roles.includes(role)) {
      userDetails.roles.push(role);
      await userDetails.save();
    }
    return;
  }

  async getCaregivers(params, user?: User) {
    const { page = 1, pageSize = 50, status, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    if (!status) query.status = 'approved';

    if (!query.suspended) {
      query.suspended = false;
    }

    const profiles = await this.professionalProfileModel.find(query);
    const userIds = await Promise.all(profiles.map((profile) => profile.user));

    const caregivers = await this.userModel
      .find({ _id: { $in: userIds } })
      .populate('professional_profile')
      .populate({
        path: 'favorited',
        match: {
          user: user ? user._id : null,
        },
      })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();
    const count = await this.userModel
      .countDocuments({ _id: { $in: userIds } })
      .exec();
    return {
      status: 'success',
      message: 'Caregivers fetched',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: caregivers,
    };
  }

  async getCaregiverById(id: string, user?: User) {
    const caregiver = await this.professionalProfileModel
      .findOne({ $or: [{ _id: id }, { user: id }] })
      .populate('user', ['first_name', 'last_name', 'profile_picture'])
      .populate({
        path: 'favorited',
        match: {
          user: user ? user._id : null,
        },
      });
    if (!caregiver) {
      throw new NotFoundException({
        status: 'error',
        message: 'Caregiver not found',
      });
    }
    return caregiver;
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
    if (profile && profile.status === 'pending') {
      throw new BadRequestException({
        status: 'error',
        message:
          'You currently have a pending Caregiver Application pending review',
      });
    }
    if (profile && profile.status === 'approved') {
      throw new BadRequestException({
        status: 'error',
        message: 'You already have a Caregiver Profile',
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
      rating: (await this.getPerformanceMetrics(user)).data.rating,
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

  async getCaregiverApplications(params) {
    const {
      page = 1,
      pageSize = 50,
      search,
      startDate,
      endDate,
      ...rest
    } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    // if (!query.status) query.status = 'pending';

    // Filter by date range (createdAt)
    if (startDate || endDate) {
      const createdAtCondition: any = {};
      if (startDate) {
        createdAtCondition.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set endDate to end of day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        createdAtCondition.$lte = end;
      }
      if (Object.keys(createdAtCondition).length > 0) {
        query.createdAt = createdAtCondition;
      }
    }

    // Global search functionality
    if (search) {
      const searchConditions: any[] = [];
      const searchRegex = new RegExp(search, 'i');

      // Search by profile_id (application id)
      // searchConditions.push({ _id: searchRegex });

      // Search by _id if search term is a valid ObjectId
      if (await this.miscService.IsObjectId(search)) {
        searchConditions.push({ _id: search });
      }

      // Search by user names (first_name, last_name)
      const userSearchRegex = new RegExp(search, 'i');
      const matchingUsers = await this.userModel
        .find({
          $or: [
            { first_name: userSearchRegex },
            { last_name: userSearchRegex },
          ],
        })
        .select('_id')
        .exec();

      if (matchingUsers.length > 0) {
        const userIds = await Promise.all(matchingUsers.map((u) => u._id));
        searchConditions.push({ user: { $in: userIds } });
      }

      // Combine search conditions with existing query using $or
      if (query.$or) {
        // If query already has $or, combine it with search conditions
        if (query.$and) {
          query.$and.push({ $or: searchConditions });
        } else {
          query.$and = [{ $or: query.$or }, { $or: searchConditions }];
          delete query.$or;
        }
      } else if (query.$and) {
        // If query already has $and (e.g., from date filtering), add search conditions
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }

    console.log(query);

    const applications = await this.professionalProfileModel
      .find(query)
      .populate('user')
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();
    const count = await this.professionalProfileModel
      .countDocuments(query)
      .exec();
    return {
      status: 'success',
      message: 'Pending caregiver applications fetched',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: applications,
    };
  }

  async getApplicationCounts() {
    const [all, pending, approved, rejected] = await Promise.all([
      this.professionalProfileModel.countDocuments().exec(),
      this.professionalProfileModel
        .countDocuments({ status: 'pending' })
        .exec(),
      this.professionalProfileModel
        .countDocuments({ status: 'approved' })
        .exec(),
      this.professionalProfileModel
        .countDocuments({ status: 'rejected' })
        .exec(),
    ]);

    return {
      status: 'success',
      message: 'Application counts fetched successfully',
      data: {
        all,
        pending,
        approved,
        rejected,
      },
    };
  }

  async updateCaregiverApplicationStatus(
    id: string,
    body: { status: string; reason: string },
  ) {
    const { status, reason } = body;
    if (status !== 'approved' && !reason) {
      throw new BadRequestException({
        status: 'error',
        message: 'Reason is required when rejecting an application',
      });
    }
    const application = await this.professionalProfileModel.findByIdAndUpdate(
      id,
      {
        status: status,
        reason: reason,
      },
      { new: true },
    );
    if (status === 'approved') {
      const careGiverRole = await this.roleModel.findOne({
        name: constants.roles.CARE_GIVER,
      });
      await this.updateUserRole(application.user, careGiverRole._id);
      await this.notificationService.sendMessage({
        user: application.user,
        title: 'Caregiver application approved',
        message: 'Your caregiver application has been approved',
        resource: 'professional-profile',
        resource_id: application._id.toString(),
      });
    }
    if (status === 'rejected') {
      await this.notificationService.sendMessage({
        user: application.user,
        title: 'Caregiver application rejected',
        message: 'Your caregiver application has been rejected',
        resource: 'professional-profile',
        resource_id: application._id.toString(),
      });
    }
    return {
      status: 'success',
      message: `Caregiver application ${status} successfully`,
      data: application,
    };
  }

  async getSingleCaregiverApplication(id: string) {
    const application = await this.professionalProfileModel
      .findById(id)
      .populate({
        path: 'user',
        select: constants.userPopulateFields,
      });
    if (!application) {
      throw new NotFoundException({
        status: 'error',
        message: 'Caregiver application not found',
      });
    }
    const user = await this.userService.getUserObject(application.user);
    return {
      ...application.toObject(),
      user,
    };
  }

  async suspendCaregiver(id: string, reason: string) {
    const profile = await this.professionalProfileModel.findById(id);

    profile.suspended = true;
    profile.suspension_reason = reason;
    await profile.save();

    await this.userModel.findByIdAndUpdate(profile.user, {
      $pull: { roles: constants.roles.CARE_GIVER },
    });

    await this.notificationService.sendMessage({
      user: profile.user,
      title: 'Caregiver profile suspended',
      message: `Your caregiver profile has been suspended: ${reason}`,
      resource: 'professional-profile',
      resource_id: profile._id.toString(),
    });
    return {
      status: 'success',
      message: 'Caregiver profile suspended',
      data: profile,
    };
  }

  async unsuspendCaregiver(id: string) {
    const profile = await this.professionalProfileModel.findById(id);

    profile.suspended = false;
    profile.suspension_reason = undefined;
    await profile.save();

    await this.notificationService.sendMessage({
      user: profile.user,
      title: 'Caregiver profile unsuspended',
      message: 'Your caregiver profile has been unsuspended',
      resource: 'professional-profile',
      resource_id: profile._id.toString(),
    });
    return {
      status: 'success',
      message: 'Caregiver unsuspended',
      data: profile,
    };
  }
}
