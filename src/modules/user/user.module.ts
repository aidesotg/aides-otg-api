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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
    ]),
    ServicesModule,
    RoleModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [UserController],
  providers: [UserService, VerificationMiddleware],
  exports: [UserService, UserModule, VerificationMiddleware],
})
export class UserModule {}
