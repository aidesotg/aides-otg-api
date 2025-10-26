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
import { ReviewService } from 'src/modules/review/services/review.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReportReviewDto,
  SuspendReviewDto,
  ReviewQueryDto,
} from 'src/modules/review/dto/review.dto';

@ApiTags('review')
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getReviews(@Query() params: ReviewQueryDto) {
    const reviews = await this.reviewService.getReviews(params);
    return {
      status: 'success',
      message: 'Reviews fetched',
      data: reviews,
    };
  }

  @Get('/caregiver/:caregiverId')
  @UseGuards(AuthGuard('jwt'))
  async getCaregiverReviews(
    @Param('caregiverId') caregiverId: string,
    @Query() params: any,
  ) {
    const reviews = await this.reviewService.getCaregiverReviews(
      caregiverId,
      params,
    );
    return {
      status: 'success',
      message: 'Caregiver reviews fetched',
      data: reviews,
    };
  }

  @Get('/user/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getUserReviews(@Param('userId') userId: string, @Query() params: any) {
    const reviews = await this.reviewService.getUserReviews(userId, params);
    return {
      status: 'success',
      message: 'User reviews fetched',
      data: reviews,
    };
  }

  @Get('/reported')
  @UseGuards(AuthGuard('jwt'))
  async getReportedReviews(@Query() params: any) {
    const reviews = await this.reviewService.getReportedReviews(params);
    return {
      status: 'success',
      message: 'Reported reviews fetched',
      data: reviews,
    };
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getReviewById(@Param('id') id: string) {
    const review = await this.reviewService.getReviewById(id);
    return {
      status: 'success',
      message: 'Review fetched',
      data: { review },
    };
  }

  @Post('/create')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createReview(@Body() body: CreateReviewDto, @AuthUser() user: any) {
    return this.reviewService.createReview(body, user);
  }

  @Put('/:id/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateReview(
    @Param('id') id: string,
    @Body() body: UpdateReviewDto,
    @AuthUser() user: any,
  ) {
    return this.reviewService.updateReview(id, body, user);
  }

  @Post('/:id/report')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async reportReview(
    @Param('id') id: string,
    @Body() body: ReportReviewDto,
    @AuthUser() user: any,
  ) {
    return this.reviewService.reportReview(id, body, user);
  }

  @Put('/:id/suspend')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async suspendReview(
    @Param('id') id: string,
    @Body() body: SuspendReviewDto,
    @AuthUser() user: any,
  ) {
    return this.reviewService.suspendReview(id, body, user);
  }

  @Put('/:id/unsuspend')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async unsuspendReview(@Param('id') id: string) {
    return this.reviewService.unsuspendReview(id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteReview(@Param('id') id: string) {
    return this.reviewService.deleteReview(id);
  }
}
