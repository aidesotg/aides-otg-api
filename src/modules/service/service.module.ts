import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceSchema } from './schema/service.schema';
import { ServiceCategorySchema } from 'src/modules/service-category/schema/service-category.schema';
import { ServicesModule } from 'src/services/services.module';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { UserBeneficiarySchema } from '../user/schema/user-beneficiary.schema';
import { ServiceDayLogsSchema } from './schema/service-day-logs.schema';
import { FavoriteSchema } from './schema/favortite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Service', schema: ServiceSchema },
      { name: 'ServiceCategory', schema: ServiceCategorySchema },
      { name: 'UserBeneficiary', schema: UserBeneficiarySchema },
      { name: 'ServiceDayLogs', schema: ServiceDayLogsSchema },
      { name: 'Favorite', schema: FavoriteSchema },
    ]),
    ServicesModule,
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService, ServiceModule],
})
export class ServiceModule {}
