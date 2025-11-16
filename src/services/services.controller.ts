import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from 'src/framework/decorators/user.decorator';

import { AwsService } from './aws.service';
import { PresignUrlDto } from './dto/presign-url.dto';
import { MiscCLass } from './misc.service';
import { TwilioService } from './twilio.service';

@Controller('services')
export class ServicesController {
  constructor(
    private awsService: AwsService,
    private miscService: MiscCLass,
    private twilioService: TwilioService,
  ) {}

  @Get('file/presign-url')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async createAnewThread(@Query() file: PresignUrlDto) {
    return this.awsService.signUrl(file);
  }

  @Get('states')
  @UsePipes(ValidationPipe)
  async getStates() {
    return this.miscService.getStates();
  }

  @Get('twilio-token')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async getTwilioToken(
    @AuthUser() user: any,
    @Query('grants') grants?: string,
  ) {
    const identity = user._id?.toString() || user.id || user.email;

    // Parse grants if provided as JSON string
    let parsedGrants;
    if (grants) {
      try {
        parsedGrants = JSON.parse(grants);
      } catch (error) {
        // If parsing fails, ignore grants
      }
    }

    const token = this.twilioService.generateAccessToken(identity, {
      voice: {
        incomingAllow: true,
        outgoingAllow: true,
      },
    });

    return {
      status: 'success',
      message: 'Twilio access token generated',
      data: {
        token,
        identity,
      },
    };
  }
}
