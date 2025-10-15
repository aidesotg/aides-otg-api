import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LegalDocumentSchema } from './schema/legal-document.schema';
import { LegalAgreementSchema } from './schema/legal-agreement.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { ServicesModule } from 'src/services/services.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'LegalDocument', schema: LegalDocumentSchema },
      { name: 'LegalAgreement', schema: LegalAgreementSchema },
      { name: 'User', schema: UserSchema },
    ]),
    ServicesModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService, LegalModule],
})
export class LegalModule {}
