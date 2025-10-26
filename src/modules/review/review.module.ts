import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewSchema } from './schema/review.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { ServicesModule } from 'src/services/services.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { SupportModule } from 'src/modules/support/support.module';
import { ReviewController } from './controllers/review.controller';
import { ReviewService } from './services/review.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Review', schema: ReviewSchema },
      { name: 'User', schema: UserSchema },
    ]),
    ServicesModule,
    forwardRef(() => NotificationModule),
    forwardRef(() => SupportModule),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService, ReviewModule],
})
export class ReviewModule {}
