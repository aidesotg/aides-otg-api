import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceSchema } from './schema/service.schema';
import { ServiceCategorySchema } from 'src/modules/service-category/schema/service-category.schema';
import { ServicesModule } from 'src/services/services.module';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Service', schema: ServiceSchema },
      { name: 'ServiceCategory', schema: ServiceCategorySchema },
    ]),
    ServicesModule,
  ],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService, ServiceModule],
})
export class ServiceModule {}
