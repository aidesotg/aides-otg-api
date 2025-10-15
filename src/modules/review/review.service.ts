import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review } from './interface/review.interface';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReportReviewDto,
  SuspendReviewDto,
  ReviewQueryDto,
} from './dto/review.dto';
import { MiscCLass } from 'src/services/misc.service';
import { NotificationService } from 'src/modules/notification/notification.service';
import { SupportService } from 'src/modules/support/support.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Review') private readonly reviewModel: Model<Review>,
    private miscService: MiscCLass,
    private notificationService: NotificationService,
    private supportService: SupportService,
  ) {}

  async createReview(createReviewDto: CreateReviewDto, user: any) {
    // Check if review already exists for this booking
    const existingReview = await this.reviewModel
      .findOne({ booking: createReviewDto.booking, is_deleted: false })
      .exec();

    if (existingReview) {
      throw new BadRequestException('Review already exists for this booking');
    }

    const data = {
      ...createReviewDto,
      reviewer: user._id,
    };

    const newReview = new this.reviewModel(data);
    const review = await newReview.save();

    // Send notification to caregiver
    await this.notificationService.sendMessage(
      { _id: createReviewDto.caregiver },
      'New Review Received',
      `You received a ${createReviewDto.rating}-star review`,
      review._id,
    );

    return {
      status: 'success',
      message: 'Review created successfully',
      data: { review },
    };
  }

  async getReviews(params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = { is_deleted: false };

    if (rest.caregiver) query.caregiver = rest.caregiver;
    if (rest.reviewer) query.reviewer = rest.reviewer;
    if (rest.rating) query.rating = rest.rating;
    if (rest.is_reported !== undefined) query.is_reported = rest.is_reported;
    if (rest.is_suspended !== undefined) query.is_suspended = rest.is_suspended;

    const reviews = await this.reviewModel
      .find(query)
      .populate('reviewer', ['fullname', 'email'])
      .populate('caregiver', ['fullname', 'email'])
      .populate('booking', ['service', 'status'])
      .populate('reported_by', ['fullname', 'email'])
      .populate('suspended_by', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.reviewModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      reviews,
    };
  }

  async getCaregiverReviews(caregiverId: string, params: any) {
    const { page = 1, pageSize = 50 } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const reviews = await this.reviewModel
      .find({ caregiver: caregiverId, is_deleted: false, is_suspended: false })
      .populate('reviewer', ['fullname', 'email'])
      .populate('booking', ['service', 'status'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.reviewModel
      .countDocuments({
        caregiver: caregiverId,
        is_deleted: false,
        is_suspended: false,
      })
      .exec();

    // Calculate average rating
    const avgRating = await this.reviewModel.aggregate([
      {
        $match: {
          caregiver: caregiverId,
          is_deleted: false,
          is_suspended: false,
        },
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      average_rating: avgRating[0]?.avgRating || 0,
      total_reviews: avgRating[0]?.totalReviews || 0,
      reviews,
    };
  }

  async getUserReviews(userId: string, params: any) {
    const { page = 1, pageSize = 50 } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const reviews = await this.reviewModel
      .find({ reviewer: userId, is_deleted: false })
      .populate('caregiver', ['fullname', 'email'])
      .populate('booking', ['service', 'status'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.reviewModel
      .countDocuments({ reviewer: userId, is_deleted: false })
      .exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      reviews,
    };
  }

  async getReportedReviews(params: any) {
    const { page = 1, pageSize = 50 } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const reviews = await this.reviewModel
      .find({ is_reported: true, is_deleted: false })
      .populate('reviewer', ['fullname', 'email'])
      .populate('caregiver', ['fullname', 'email'])
      .populate('reported_by', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.reviewModel
      .countDocuments({ is_reported: true, is_deleted: false })
      .exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      reviews,
    };
  }

  async getReviewById(id: string) {
    const review = await this.reviewModel
      .findOne({ _id: id, is_deleted: false })
      .populate('reviewer', ['fullname', 'email'])
      .populate('caregiver', ['fullname', 'email'])
      .populate('booking', ['service', 'status'])
      .populate('reported_by', ['fullname', 'email'])
      .populate('suspended_by', ['fullname', 'email'])
      .exec();

    if (!review) {
      throw new NotFoundException({
        status: 'error',
        message: 'Review not found',
      });
    }

    return review;
  }

  async updateReview(id: string, updateReviewDto: UpdateReviewDto, user: any) {
    const review = await this.reviewModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!review) {
      throw new NotFoundException({
        status: 'error',
        message: 'Review not found',
      });
    }

    // Only allow reviewer or admin to update
    if (
      review.reviewer.toString() !== user._id &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      throw new BadRequestException('You can only update your own reviews');
    }

    const data: any = { ...updateReviewDto };
    for (const value in data) {
      if (data[value] !== undefined) {
        review[value] = data[value];
      }
    }

    await review.save();

    return {
      status: 'success',
      message: 'Review updated',
      data: { review },
    };
  }

  async reportReview(id: string, reportReviewDto: ReportReviewDto, user: any) {
    const review = await this.reviewModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!review) {
      throw new NotFoundException({
        status: 'error',
        message: 'Review not found',
      });
    }

    if (review.is_reported) {
      throw new BadRequestException('Review already reported');
    }

    review.is_reported = true;
    review.report_reason = reportReviewDto.report_reason;
    review.report_details = reportReviewDto.report_details;
    review.reported_by = user._id;
    await review.save();

    // Create support ticket for reported review
    await this.supportService.createTicket(
      {
        title: `Reported Review - ${review._id}`,
        description: `Review reported: ${reportReviewDto.report_reason}. Details: ${reportReviewDto.report_details}`,
        category: 'complaint',
        priority: 'medium',
      },
      user,
    );

    return {
      status: 'success',
      message: 'Review reported successfully',
      data: { review },
    };
  }

  async suspendReview(
    id: string,
    suspendReviewDto: SuspendReviewDto,
    user: any,
  ) {
    const review = await this.reviewModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!review) {
      throw new NotFoundException({
        status: 'error',
        message: 'Review not found',
      });
    }

    review.is_suspended = true;
    review.suspension_reason = suspendReviewDto.suspension_reason;
    review.suspended_by = user._id;
    await review.save();

    return {
      status: 'success',
      message: 'Review suspended successfully',
      data: { review },
    };
  }

  async unsuspendReview(id: string) {
    const review = await this.reviewModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!review) {
      throw new NotFoundException({
        status: 'error',
        message: 'Review not found',
      });
    }

    review.is_suspended = false;
    review.suspension_reason = undefined;
    review.suspended_by = undefined;
    await review.save();

    return {
      status: 'success',
      message: 'Review unsuspended successfully',
      data: { review },
    };
  }

  async deleteReview(id: string) {
    const review = await this.reviewModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!review) {
      throw new NotFoundException({
        status: 'error',
        message: 'Review not found',
      });
    }

    review.is_deleted = true;
    await review.save();

    return {
      status: 'success',
      message: 'Review deleted successfully',
    };
  }
}
