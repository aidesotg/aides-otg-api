import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TermsSchema } from './schema/terms.schema';
import { TermsController } from './controllers/terms.controller';
import { TermsService } from './services/terms.service';
import { ServicesModule } from 'src/services/services.module';
import { UserSchema } from '../user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Terms', schema: TermsSchema },
      { name: 'User', schema: UserSchema },
    ]),

    ServicesModule,
  ],
  controllers: [TermsController],
  providers: [TermsService],
})
export class TermsModule {}
