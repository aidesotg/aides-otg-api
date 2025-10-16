import { HttpModule, Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { BackblazeService } from './backblaze.service';
import { FirebaseService } from './firebase.service';
import { FlutterwaveService } from './flutterwave.service';
import { Mailer } from './mailer.service';
import { MiscCLass } from './misc.service';
import { ServicesController } from './services.controller';
import { VideoSdkService } from './videosdk.service';
import { PaystackService } from './paystack.service';
import { StripeService } from './stripe.service';
import { StripeModule } from 'nestjs-stripe';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/modules/user/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_SECRET,
      apiVersion: '2020-08-27',
    }),
    HttpModule,
  ],
  providers: [
    Mailer,
    BackblazeService,
    FlutterwaveService,
    MiscCLass,
    AwsService,
    FirebaseService,
    VideoSdkService,
    PaystackService,
    StripeService,
  ],
  exports: [
    Mailer,
    BackblazeService,
    FlutterwaveService,
    MiscCLass,
    AwsService,
    VideoSdkService,
    FirebaseService,
    PaystackService,
    StripeService,
  ],
  controllers: [ServicesController],
})
export class ServicesModule {}
