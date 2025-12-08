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
import { ServiceRequestDayLogs } from 'src/modules/service-request/interface/service-request-day-logs.schema';
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
  private expiredDayLogsJob: CronJob;

  constructor(
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
    @InjectModel('ServiceRequestDayLogs')
    private readonly serviceRequestDayLogsModel: Model<ServiceRequestDayLogs>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    private readonly notificationService: NotificationService,
    private readonly mailerService: Mailer,
  ) {}

  onModuleInit() {
    this.startExpiredRequestJob();
    this.startUpcomingRequestReminderJob();
    this.startExpiredDayLogsJob();
  }

  onModuleDestroy() {
    if (this.expiredRequestsJob) {
      this.expiredRequestsJob.stop();
    }
    if (this.upcomingRequestReminderJob) {
      this.upcomingRequestReminderJob.stop();
    }
    if (this.expiredDayLogsJob) {
      this.expiredDayLogsJob.stop();
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

  private startExpiredDayLogsJob() {
    this.logger.log(
      'Starting expired day logs cron job (runs every 15 minutes)',
    );

    this.expiredDayLogsJob = new CronJob(
      '*/15 * * * *',
      () => {
        this.handleExpiredDayLogs().catch((error) => {
          this.logger.error(
            'Failed to update expired service request day logs',
            error?.stack,
          );
        });
      },
      null,
      true,
      DEFAULT_TIMEZONE,
    );

    // Run once immediately
    this.handleExpiredDayLogs().catch((error) => {
      this.logger.error(
        'Failed to update expired service request day logs on startup',
        error?.stack,
      );
    });
  }

  private async handleExpiredDayLogs() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const candidateLogs = await this.serviceRequestDayLogsModel
      .find({
        status: { $nin: ['Completed', 'Cancelled', 'Rejected', 'Expired'] },
      })
      .select(['_id', 'day_id', 'request'])
      .lean();

    if (!candidateLogs.length) {
      return;
    }

    const logsToExpire: string[] = [];

    for (const log of candidateLogs) {
      const request = await this.serviceRequestModel
        .findOne(
          { _id: log.request, 'date_list._id': log.day_id },
          { date_list: 1 },
        )
        .lean();

      if (!request?.date_list?.length) {
        continue;
      }

      const dayEntry = request.date_list.find(
        (d: any) => d._id?.toString() === log.day_id.toString(),
      );

      if (!dayEntry?.date) {
        continue;
      }

      const dayDate = new Date(dayEntry.date);
      if (Number.isNaN(dayDate.getTime())) {
        continue;
      }

      if (dayDate.getTime() < startOfToday.getTime()) {
        logsToExpire.push(log._id.toString());
      }
    }

    if (!logsToExpire.length) {
      return;
    }

    await this.serviceRequestDayLogsModel.bulkWrite(
      logsToExpire.map((id) => ({
        updateOne: {
          filter: { _id: id },
          update: {
            $set: { status: 'Expired' },
            $push: {
              status_history: { status: 'Expired', created_at: now },
            },
          },
        },
      })),
    );

    this.logger.log(
      `Marked ${logsToExpire.length} service request day log(s) as expired`,
    );
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
      request: any;
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
        request: request,
      });
    }

    if (!remindersToSend.length) {
      return;
    }

    for (const reminder of remindersToSend) {
      const readableTime = reminder.slotTime.toISOString();
      const bookingLabel = reminder.bookingId ?? reminder.requestId;
      const message = `Service request with booking ID:${bookingLabel} is due to start in 2 hours at ${readableTime}. No Caregiver has been assigned yet.`;
      const details = `Care Types: ${reminder.request.care_type.join(
        ', ',
      )}, Location: ${reminder.request.location.street}, ${
        reminder.request.location.city
      }, ${reminder.request.location.state}, ${
        reminder.request.location.country
      }`;

      await Promise.all(
        adminUsers.map((admin) =>
          Promise.all([
            this.notificationService.sendMessage({
              user: admin,
              title: 'Service request reminder: URGENT!',
              message,
              resource: 'service_request',
              resource_id: reminder.requestId,
            }),
            this.mailerService.send(
              new PlainMail(
                admin.email,
                'Service request reminder: URGENT!',
                details,
                admin,
                message,
              ),
            ),
          ]),
        ),
      );

      await this.serviceRequestModel.updateOne(
        { _id: reminder.requestId },
        { admin_first_day_reminder_sent: true, status: 'Urgent' },
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
