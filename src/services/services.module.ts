import { HttpModule, Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { BackblazeService } from './backblaze.service';
import { FirebaseService } from './firebase.service';
import { GoogleService } from './google.service';
import { Mailer } from './mailer.service';
import { MiscCLass } from './misc.service';
import { ServicesController } from './services.controller';
import { StripeService } from './stripe.service';
import { RedisService } from './redis.service';
import { TwilioService } from './twilio.service';
import { StripeModule } from 'nestjs-stripe';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { CallRecordingSchema } from 'src/modules/service-request/schema/call-recordings.schema';
import { ServiceRequestDayLogsSchema } from 'src/modules/service-request/schema/service-request-day-logs.schema';
import { KycAidService } from './kycaid.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }, { name: 'CallRecording', schema: CallRecordingSchema }, { name: 'ServiceRequestDayLogs', schema: ServiceRequestDayLogsSchema }]),
    StripeModule.forRoot({
      apiKey: process.env.STRIPE_SECRET,
      apiVersion: '2020-08-27',
    }),
    HttpModule,
  ],
  providers: [
    Mailer,
    BackblazeService,
    GoogleService,
    MiscCLass,
    AwsService,
    FirebaseService,
    StripeService,
    RedisService,
    TwilioService,
    KycAidService,
  ],
  exports: [
    Mailer,
    BackblazeService,
    GoogleService,
    MiscCLass,
    AwsService,
    FirebaseService,
    StripeService,
    RedisService,
    TwilioService,
    KycAidService,
  ],
  controllers: [ServicesController],
})
export class ServicesModule { }
