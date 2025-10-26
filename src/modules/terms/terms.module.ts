import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TermsSchema } from './schema/terms.schema';
import { TermsController } from './controllers/terms.controller';
import { TermsService } from './services/terms.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Terms', schema: TermsSchema }]),
  ],
  controllers: [TermsController],
  providers: [TermsService],
})
export class TermsModule {}
