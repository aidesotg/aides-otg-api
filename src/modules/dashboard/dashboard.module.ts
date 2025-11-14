import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { UserSchema } from '../user/schema/user.schema';
import { ServiceRequestSchema } from '../service-request/schema/service-request.schema';
import { RoleSchema } from '../role/schema/role.schema';
import { WalletTransactionSchema } from '../wallet/schema/wallet-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'ServiceRequest', schema: ServiceRequestSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'WalletTransaction', schema: WalletTransactionSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
