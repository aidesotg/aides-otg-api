import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InsuranceSchema } from './schema/insurance.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { ServicesModule } from 'src/services/services.module';
import { UserModule } from 'src/modules/user/user.module';
import { InsuranceController } from './insurance.controller';
import { InsuranceService } from './insurance.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Insurance', schema: InsuranceSchema },
      { name: 'User', schema: UserSchema },
    ]),
    ServicesModule,
    forwardRef(() => UserModule),
  ],
  controllers: [InsuranceController],
  providers: [InsuranceService],
  exports: [InsuranceService, InsuranceModule],
})
export class InsuranceModule {}
