import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServiceCategorySchema } from './schema/service-category.schema';
import { ServicesModule } from 'src/services/services.module';
import { ServiceCategoryController } from './service-category.controller';
import { ServiceCategoryService } from './service-category.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ServiceCategory', schema: ServiceCategorySchema },
    ]),
    ServicesModule,
  ],
  controllers: [ServiceCategoryController],
  providers: [ServiceCategoryService],
  exports: [ServiceCategoryService, ServiceCategoryModule],
})
export class ServiceCategoryModule {}
