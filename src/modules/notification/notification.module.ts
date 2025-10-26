import { forwardRef, Module } from '@nestjs/common';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { UserModule } from 'src/modules/user/user.module';
import { ServicesModule } from 'src/services/services.module';
import { RoleModule } from 'src/modules/role/role.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from 'src/modules/role/schema/role.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { NotificationSchema } from './schema/notification.schema';
import { BroadcastSchema } from './schema/broadcast.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'Notification', schema: NotificationSchema },
      { name: 'Broadcast', schema: BroadcastSchema },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => ServicesModule),
    RoleModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationModule, NotificationService],
})
export class NotificationModule {}
