import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RateSettingsSchema } from './schema/rate-settings.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { ServicesModule } from 'src/services/services.module';
import { ServiceModule } from 'src/modules/service/service.module';
import { RateController } from './controllers/rate.controller';
import { RateService } from './services/rate.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RateSettings', schema: RateSettingsSchema },
      { name: 'User', schema: UserSchema },
    ]),
    ServicesModule,
    forwardRef(() => ServiceModule),
  ],
  controllers: [RateController],
  providers: [RateService],
  exports: [RateService, RateModule],
})
export class RateModule {}
