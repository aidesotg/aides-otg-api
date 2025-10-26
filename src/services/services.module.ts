import { HttpModule, Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { BackblazeService } from './backblaze.service';
import { FirebaseService } from './firebase.service';
import { GoogleService } from './google.service';
import { Mailer } from './mailer.service';
import { MiscCLass } from './misc.service';
import { ServicesController } from './services.controller';
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
    GoogleService,
    MiscCLass,
    AwsService,
    FirebaseService,
    StripeService,
  ],
  exports: [
    Mailer,
    BackblazeService,
    GoogleService,
    MiscCLass,
    AwsService,
    FirebaseService,
    StripeService,
  ],
  controllers: [ServicesController],
})
export class ServicesModule {}
