import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './services/wallet.service';
import { WalletController } from './controllers/wallet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { TransactionSchema } from './schema/transaction.schema';
import { WalletTransactionSchema } from './schema/wallet-transaction.schema';
import { UserModule } from 'src/modules/user/user.module';
import { ServicesModule } from 'src/services/services.module';
import { WalletSchema } from './schema/wallet.schema';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { WithdrawalOtpSchema } from './schema/withdrawal-otp.schema';
import { ServiceRequestModule } from '../service-request/service-request.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Transaction', schema: TransactionSchema },
      { name: 'Wallet', schema: WalletSchema },
      { name: 'WalletTransaction', schema: WalletTransactionSchema },

      { name: 'WithdrawalOtp', schema: WithdrawalOtpSchema },
    ]),
    forwardRef(() => UserModule),
    ServicesModule,
    NotificationModule,
    forwardRef(() => ServiceRequestModule),
  ],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletModule, WalletService],
})
export class WalletModule {}
