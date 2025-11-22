import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CronjobService } from './cronjob.service';
import { CronjobController } from './cronjob.controller';
import { ServiceRequestSchema } from 'src/modules/service-request/schema/service-request.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'ServiceRequest', schema: ServiceRequestSchema },
    ]),
  ],
  providers: [CronjobService],
  controllers: [CronjobController],
})
export class CronjobModule {}
