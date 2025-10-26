import { Module } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { UserModule } from 'src/modules/user/user.module';
import { ServicesModule } from 'src/services/services.module';
import { RoleModule } from 'src/modules/role/role.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from 'src/modules/role/schema/role.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { ChatEntitySchema } from './schema/chat-entity.schema';
import { ChannelSchema } from './schema/channel.schema';
import { ChannelMessageSchema } from './schema/channel-messages.schema';
import { EntityChannelStatusSchema } from './schema/entity-channel-status.schema';
import { forwardRef } from '@nestjs/common';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { ServiceSchema } from '../service/schema/service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'ChatEntity', schema: ChatEntitySchema },
      { name: 'Channel', schema: ChannelSchema },
      { name: 'ChannelMessage', schema: ChannelMessageSchema },
      { name: 'EntityChannelStatus', schema: EntityChannelStatusSchema },
      { name: 'Service', schema: ServiceSchema },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => ServicesModule),
    RoleModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService, ChatModule],
})
export class ChatModule {}
