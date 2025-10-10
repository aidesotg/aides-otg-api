import { Module } from '@nestjs/common';
import { AwsService } from './aws.service';
import { BackblazeService } from './backblaze.service';
import { FirebaseService } from './firebase.service';
import { FlutterwaveService } from './flutterwave.service';
import { Mailer } from './mailer.service';
import { MiscCLass } from './misc.service';
import { ServicesController } from './services.controller';
import { VideoSdkService } from './videosdk.service';

@Module({
  providers: [
    Mailer,
    BackblazeService,
    FlutterwaveService,
    MiscCLass,
    AwsService,
    FirebaseService,
    VideoSdkService,
  ],
  exports: [
    Mailer,
    BackblazeService,
    FlutterwaveService,
    MiscCLass,
    AwsService,
    VideoSdkService,
    FirebaseService,
  ],
  controllers: [ServicesController],
})
export class ServicesModule {}
