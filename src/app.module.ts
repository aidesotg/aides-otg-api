import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthzModule } from './framework/authz/authz.module';
import * as dotenv from 'dotenv';
import { UserModule } from './modules/user/user.module';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { RoleModule } from './modules/role/role.module';
import { PermissionModule } from './modules/permission/permission.module';
import { RolePermissionsModule } from './modules/role-permissions/role-permissions.module';
import { ServicesModule } from './services/services.module';
import { VerificationMiddleware } from './framework/middlewares/verify.middleware';
import { NotificationModule } from './modules/notification/notification.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ServiceModule } from './modules/service/service.module';
import { TermsModule } from './modules/terms/terms.module';
import { SupportModule } from './modules/support/support.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ChatModule } from './modules/chat/chat.module';
import { ServiceCategoryModule } from './modules/service-category/service-category.module';
import { InsuranceCompanyModule } from './modules/insurance-company/insurance-company.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { ServiceRequestModule } from './modules/service-request/service-request.module';
import { FaqModule } from './modules/faq/faq.module';
import { LegalModule } from './modules/legal/legal.module';
import { RateModule } from './modules/rate/rate.module';

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI, {
      useFindAndModify: false,
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthzModule,
    UserModule,
    AuthenticationModule,
    RoleModule,
    PermissionModule,
    RolePermissionsModule,
    ServiceModule,
    ServicesModule,
    ServiceCategoryModule,
    SupportModule,
    NotificationModule,
    SettingsModule,
    WalletModule,
    LegalModule,
    TermsModule,
    ChatModule,
    RateModule,
    InsuranceCompanyModule,
    ActivityLogsModule,
    ServiceRequestModule,
    FaqModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(VerificationMiddleware).forRoutes(
      'auth/register',
      'user/create',
      // 'user/profile/update',
      'user/profile/update/email',
      'user/profile/update/phone',
    );
  }
}
