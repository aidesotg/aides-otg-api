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
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { User } from 'src/modules/user/interface/user.interface';
import { Role } from 'src/modules/role/interface/role.interface';
import { Mailer } from 'src/services/mailer.service';
import PlainMail from 'src/services/mailers/templates/plain-mail';
import constants, { DEFAULT_TIMEZONE } from 'src/framework/constants';

@Injectable()
export class CronjobService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronjobService.name);
  private expiredRequestsJob: CronJob;
  private upcomingRequestReminderJob: CronJob;

  constructor(
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    private readonly notificationService: NotificationService,
    private readonly mailerService: Mailer,
  ) {}

  onModuleInit() {
    this.startExpiredRequestJob();
    this.startUpcomingRequestReminderJob();
  }

  onModuleDestroy() {
    if (this.expiredRequestsJob) {
      this.expiredRequestsJob.stop();
    }
    if (this.upcomingRequestReminderJob) {
      this.upcomingRequestReminderJob.stop();
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
      DEFAULT_TIMEZONE,
    );

    // Run once immediately
    this.handleExpiredRequests().catch((error) => {
      this.logger.error(
        'Failed to update expired service requests on startup',
        error?.stack,
      );
    });
  }

  private startUpcomingRequestReminderJob() {
    this.logger.log(
      'Starting upcoming service request reminder cron job (runs every 5 minutes)',
    );

    this.upcomingRequestReminderJob = new CronJob(
      '*/5 * * * *',
      () => {
        this.sendUpcomingRequestReminders().catch((error) => {
          this.logger.error(
            'Failed to process upcoming service request reminders',
            error?.stack,
          );
        });
      },
      null,
      true,
      DEFAULT_TIMEZONE,
    );

    this.sendUpcomingRequestReminders().catch((error) => {
      this.logger.error(
        'Failed to process upcoming service request reminders on startup',
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

  private async sendUpcomingRequestReminders() {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const adminUsers = await this.getAdminUsers();
    if (!adminUsers.length) {
      this.logger.warn(
        'No admin users found for upcoming service request reminders',
      );
      return;
    }

    const candidateRequests = await this.serviceRequestModel
      .find({
        admin_first_day_reminder_sent: false,
        status: { $nin: ['Completed', 'Cancelled', 'Rejected', 'Expired'] },
        date_list: { $exists: true, $ne: [] },
      })
      .select(['_id', 'booking_id', 'date_list'])
      .lean();

    if (!candidateRequests.length) {
      return;
    }

    const remindersToSend: {
      requestId: string;
      slotTime: Date;
      bookingId?: string;
    }[] = [];

    for (const request of candidateRequests) {
      const firstSlotTime = this.getFirstSlotDateTime(request.date_list);
      if (!firstSlotTime) continue;

      const msUntilStart = firstSlotTime.getTime() - now.getTime();
      if (msUntilStart <= 0) {
        continue;
      }
      if (firstSlotTime > twoHoursFromNow) {
        continue;
      }

      remindersToSend.push({
        requestId: request._id.toString(),
        slotTime: firstSlotTime,
        bookingId: request.booking_id,
      });
    }

    if (!remindersToSend.length) {
      return;
    }

    for (const reminder of remindersToSend) {
      const readableTime = reminder.slotTime.toISOString();
      const bookingLabel = reminder.bookingId ?? reminder.requestId;
      const message = `Service request ${bookingLabel} starts at ${readableTime}. Please ensure all logistics are in place.`;

      await Promise.all(
        adminUsers.map((admin) =>
          Promise.all([
            this.notificationService.sendMessage({
              user: admin,
              title: 'Upcoming service request',
              message,
              resource: 'service_request',
              resource_id: reminder.requestId,
            }),
            this.mailerService.send(
              new PlainMail(
                admin.email,
                'Upcoming service request',
                '',
                admin,
                message,
              ),
            ),
          ]),
        ),
      );

      await this.serviceRequestModel.updateOne(
        { _id: reminder.requestId },
        { admin_first_day_reminder_sent: true },
      );
    }
  }

  private getFirstSlotDateTime(dateList: any[]): Date | null {
    if (!Array.isArray(dateList) || !dateList.length) {
      return null;
    }

    let earliest: Date | null = null;
    for (const slot of dateList) {
      const slotDateTime = this.buildSlotDate(slot);
      if (!slotDateTime) continue;
      if (!earliest || slotDateTime < earliest) {
        earliest = slotDateTime;
      }
    }

    return earliest;
  }

  private buildSlotDate(slot: any): Date | null {
    if (!slot?.date) return null;
    const slotDate = new Date(slot.date);
    if (Number.isNaN(slotDate.getTime())) {
      return null;
    }

    slotDate.setHours(0, 0, 0, 0);

    if (slot.start_time) {
      const [hoursStr, minutesStr] = String(slot.start_time).split(':');
      const hours = Number.parseInt(hoursStr, 10);
      const minutes = Number.parseInt(minutesStr ?? '0', 10);
      if (!Number.isNaN(hours)) {
        slotDate.setHours(hours);
      }
      if (!Number.isNaN(minutes)) {
        slotDate.setMinutes(minutes);
      }
    }
    slotDate.setSeconds(0, 0);

    return slotDate;
  }

  private async getAdminUsers() {
    const adminRoles = await this.roleModel
      .find({
        name: {
          $in: [constants.roles.SUPER_ADMIN, constants.roles.SUPPORT_ADMIN],
        },
      })
      .select('_id')
      .exec();

    if (!adminRoles.length) {
      return [];
    }

    const roleIds = adminRoles.map((role) => role._id);

    return this.userModel
      .find({
        roles: { $in: roleIds },
        isDeleted: false,
      })
      .select(['first_name', 'last_name', 'email']);
  }
}
