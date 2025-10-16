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
    NotificationModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VerificationMiddleware)
      .forRoutes('auth/register', 'user/create', 'user/profile/update');
  }
}
