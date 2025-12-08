import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronjobService } from './cronjob.service';
import { CronjobController } from './cronjob.controller';
import { ServiceRequestSchema } from 'src/modules/service-request/schema/service-request.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { RoleSchema } from 'src/modules/role/schema/role.schema';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { ServicesModule } from 'src/services/services.module';
import { ServiceRequestDayLogsSchema } from 'src/modules/service-request/schema/service-request-day-logs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ServiceRequest', schema: ServiceRequestSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'ServiceRequestDayLogs', schema: ServiceRequestDayLogsSchema },
    ]),
    NotificationModule,
    ServicesModule,
  ],
  providers: [CronjobService],
  controllers: [CronjobController],
})
export class CronjobModule {}
