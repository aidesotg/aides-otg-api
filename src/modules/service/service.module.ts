import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceSchema } from './schema/service.schema';
import { ServiceCategorySchema } from 'src/modules/service-category/schema/service-category.schema';
import { ServicesModule } from 'src/services/services.module';
import { ServiceController } from './controllers/service.controller';
import { ServiceService } from './services/service.service';
import { UserBeneficiarySchema } from '../user/schema/user-beneficiary.schema';
import { FavoriteSchema } from '../service-request/schema/favortite.schema';
import { ServiceRequestSchema } from '../service-request/schema/service-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Service', schema: ServiceSchema },
      { name: 'ServiceCategory', schema: ServiceCategorySchema },
      { name: 'UserBeneficiary', schema: UserBeneficiarySchema },
      { name: 'Favorite', schema: FavoriteSchema },
      { name: 'ServiceRequest', schema: ServiceRequestSchema },
    ]),
    ServicesModule,
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService, ServiceModule],
})
export class ServiceModule {}
