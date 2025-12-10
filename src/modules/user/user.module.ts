import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from 'src/modules/role/schema/role.schema';
import { ServicesModule } from 'src/services/services.module';
import { VerificationMiddleware } from 'src/framework/middlewares/verify.middleware';
import { UserSchema } from './schema/user.schema';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { RoleModule } from 'src/modules/role/role.module';
import { NotificationModule } from '../notification/notification.module';
import { UserBeneficiarySchema } from './schema/user-beneficiary.schema';
import { BeneficiarySchema } from './schema/beneficiary.schema';
import { InsuranceSchema } from '../insurance/schema/insurance.schema';
import { InsuranceModule } from '../insurance/insurance.module';
import { WalletModule } from '../wallet/wallet.module';
import { WalletSchema } from '../wallet/schema/wallet.schema';
import { ProfessionalProfileSchema } from './schema/professional-profile.schema';
import { CaregiverService } from './services/caregiver.service';
import { CaregiverController } from './controllers/caregiver.controller';
import { BeneficiaryController } from './controllers/beneficiary.controller';
import { BeneficiaryService } from './services/beneficiary.service';
import { BankSchema } from './schema/bank.schema';
import { ReviewSchema } from '../service-request/schema/review.schema';
import { ServiceRequestSchema } from '../service-request/schema/service-request.schema';
import { KycSchema } from './schema/kyc.schema';
import { ServiceRequestDayLogsSchema } from '../service-request/schema/service-request-day-logs.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'UserBeneficiary', schema: UserBeneficiarySchema },
      { name: 'Beneficiary', schema: BeneficiarySchema },
      { name: 'Insurance', schema: InsuranceSchema },
      { name: 'Wallet', schema: WalletSchema },
      { name: 'ProfessionalProfile', schema: ProfessionalProfileSchema },
      { name: 'Bank', schema: BankSchema },
      { name: 'Review', schema: ReviewSchema },
      { name: 'ServiceRequest', schema: ServiceRequestSchema },
      { name: 'Kyc', schema: KycSchema },
      { name: 'ServiceRequestDayLogs', schema: ServiceRequestDayLogsSchema },
    ]),
    ServicesModule,
    RoleModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => InsuranceModule),
    forwardRef(() => WalletModule),
  ],
  controllers: [BeneficiaryController, CaregiverController, UserController],
  providers: [
    BeneficiaryService,
    CaregiverService,
    UserService,
    VerificationMiddleware,
  ],
  exports: [CaregiverService, UserService, UserModule, VerificationMiddleware],
})
export class UserModule {}
