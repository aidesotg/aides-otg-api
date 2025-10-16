import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from 'src/modules/role/schema/role.schema';
import { ServicesModule } from 'src/services/services.module';
import { VerificationMiddleware } from 'src/framework/middlewares/verify.middleware';
import { UserSchema } from './schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { RoleModule } from 'src/modules/role/role.module';
import { NotificationModule } from '../notification/notification.module';
import { UserBeneficiarySchema } from './schema/user-beneficiary.schema';
import { BeneficiarySchema } from './schema/beneficiary.schema';
import { InsuranceSchema } from '../insurance/schema/insurance.schema';
import { InsuranceModule } from '../insurance/insurance.module';
import { WalletModule } from '../wallet/wallet.module';
import { WalletSchema } from '../wallet/schema/wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'UserBeneficiary', schema: UserBeneficiarySchema },
      { name: 'Beneficiary', schema: BeneficiarySchema },
      { name: 'Insurance', schema: InsuranceSchema },
      { name: 'Wallet', schema: WalletSchema },
    ]),
    ServicesModule,
    RoleModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => InsuranceModule),
    forwardRef(() => WalletModule),
  ],
  controllers: [UserController],
  providers: [UserService, VerificationMiddleware],
  exports: [UserService, UserModule, VerificationMiddleware],
})
export class UserModule {}
