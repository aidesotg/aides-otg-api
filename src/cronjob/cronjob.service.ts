import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CronJob } from 'cron';
import { ServiceRequest } from 'src/modules/service-request/interface/service-request.interface';

@Injectable()
export class CronjobService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronjobService.name);
  private expiredRequestsJob: CronJob;

  constructor(
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
  ) {}

  onModuleInit() {
    this.startExpiredRequestJob();
  }

  onModuleDestroy() {
    if (this.expiredRequestsJob) {
      this.expiredRequestsJob.stop();
    }
  }

  private startExpiredRequestJob() {
    this.logger.log(
      'Starting expired service requests cron job (runs every 30 minutes)',
    );

    this.expiredRequestsJob = new CronJob(
      '*/30 * * * *',
      () => {
        this.handleExpiredRequests().catch((error) => {
          this.logger.error(
            'Failed to update expired service requests',
            error?.stack,
          );
        });
      },
      null,
      true,
      'UTC',
    );

    // Run once immediately
    this.handleExpiredRequests().catch((error) => {
      this.logger.error(
        'Failed to update expired service requests on startup',
        error?.stack,
      );
    });
  }

  private getLatestScheduledDate(dateList: any[]): Date | null {
    if (!Array.isArray(dateList) || dateList.length === 0) {
      return null;
    }

    let latest: Date | null = null;

    for (const slot of dateList) {
      if (!slot?.date) continue;
      const slotDate = new Date(slot.date);
      if (Number.isNaN(slotDate.getTime())) continue;

      if (!latest || slotDate > latest) {
        latest = slotDate;
      }
    }

    return latest;
  }

  private async handleExpiredRequests() {
    const now = new Date();
    const candidates = await this.serviceRequestModel
      .find({
        status: {
          $nin: [
            'Completed',
            'Cancelled',
            'Rejected',
            'Expired',
            'In Progress',
          ],
        },
        date_list: { $exists: true, $ne: [] },
      })
      .select(['_id', 'date_list'])
      .lean();

    if (!candidates.length) {
      return;
    }

    const expiredIds = candidates
      .filter((request: any) => {
        const latestDate = this.getLatestScheduledDate(request.date_list);
        return latestDate && latestDate.getTime() < now.getTime();
      })
      .map((request) => request._id);

    if (!expiredIds.length) {
      return;
    }

    await Promise.all(
      expiredIds.map((id) =>
        this.serviceRequestModel.updateOne(
          { _id: id },
          {
            $set: { status: 'Expired' },
            $push: {
              status_history: {
                status: 'Expired',
                created_at: now,
              },
            },
          },
        ),
      ),
    );

    this.logger.log(
      `Marked ${expiredIds.length} service request(s) as expired`,
    );
  }
}
