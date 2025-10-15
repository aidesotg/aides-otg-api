import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientSchema } from './schema/patient.schema';
import { InsuranceSchema } from 'src/modules/insurance/schema/insurance.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { ServicesModule } from 'src/services/services.module';
import { InsuranceModule } from 'src/modules/insurance/insurance.module';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Patient', schema: PatientSchema },
      { name: 'Insurance', schema: InsuranceSchema },
      { name: 'User', schema: UserSchema },
    ]),
    ServicesModule,
    forwardRef(() => InsuranceModule),
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService, PatientModule],
})
export class PatientModule {}
