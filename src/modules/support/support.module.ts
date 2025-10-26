import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketSchema } from './schema/ticket.schema';
import { TicketMessageSchema } from './schema/ticket-message.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { ServicesModule } from 'src/services/services.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { SupportController } from './controllers/support.controller';
import { SupportService } from './services/support.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Ticket', schema: TicketSchema },
      { name: 'TicketMessage', schema: TicketMessageSchema },
      { name: 'User', schema: UserSchema },
    ]),
    ServicesModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService, SupportModule],
})
export class SupportModule {}
