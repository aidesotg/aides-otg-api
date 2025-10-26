import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceRequestSchema } from './schema/service-request.schema';
import { ServiceCategorySchema } from 'src/modules/service-category/schema/service-category.schema';
import { ServicesModule } from 'src/services/services.module';
import { ServiceRequestController } from './controllers/service-request.controller';
import { ServiceRequestService } from './services/service-request.service';
import { UserBeneficiarySchema } from '../user/schema/user-beneficiary.schema';
import { ServiceRequestDayLogsSchema } from './schema/service-request-day-logs.schema';
import { FavoriteSchema } from './schema/favortite.schema';
import { NotificationModule } from '../notification/notification.module';
import { ReviewSchema } from './schema/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ServiceRequest', schema: ServiceRequestSchema },
      { name: 'ServiceCategory', schema: ServiceCategorySchema },
      { name: 'UserBeneficiary', schema: UserBeneficiarySchema },
      { name: 'ServiceRequestDayLogs', schema: ServiceRequestDayLogsSchema },
      { name: 'Favorite', schema: FavoriteSchema },
      { name: 'Review', schema: ReviewSchema },
    ]),
    ServicesModule,
    NotificationModule,
  ],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService, ServiceRequestModule],
})
export class ServiceRequestModule {}
