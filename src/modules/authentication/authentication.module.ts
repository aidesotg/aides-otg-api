import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleModule } from 'src/modules/role/role.module';
import { RoleSchema } from 'src/modules/role/schema/role.schema';
import { ServicesModule } from 'src/services/services.module';
import { PasswordResetSchema } from 'src/modules/user/schema/password-reset.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { AuthenticationController } from './controllers/authentication.controller';
import { AuthenticationService } from './services/authentication.service';
import { AdminLoginSchema } from './schema/admin-login.schema';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'PasswordReset', schema: PasswordResetSchema },
      { name: 'AdminLogin', schema: AdminLoginSchema },
    ]),
    forwardRef(() => RoleModule),
    ServicesModule,
    forwardRef(() => WalletModule),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}
