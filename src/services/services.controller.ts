import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
  Put,
  Res,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { Response, Request } from 'express';

import { AwsService } from './aws.service';
import { PresignUrlDto } from './dto/presign-url.dto';
import { MiscCLass } from './misc.service';
import { TwilioService } from './twilio.service';
import {
  MakeCallDto,
  MakeCallWithTwimlDto,
  UpdateCallStatusDto,
} from './dto/twilio-call.dto';

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

  @Post('twilio/calls')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async createTwilioCall(@Body() body: MakeCallDto) {
    const {
      to,
      from,
      url,
      method,
      statusCallback,
      statusCallbackMethod,
      record,
    } = body;

    const response = await this.twilioService.makeCall(
      to,
      from,
      url,
      method,
      statusCallback,
      statusCallbackMethod,
      record,
    );

    return {
      status: 'success',
      message: 'Call initiated successfully',
      data: response,
    };
  }

  @Post('twilio/calls/twiml')
  // @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async createTwilioCallWithTwiml(@Body() body: MakeCallWithTwimlDto) {
    console.log(
      '🚀 ~ ServicesController ~ createTwilioCallWithTwiml ~ body:',
      body,
    );
    const { to, twiml, from, statusCallback, statusCallbackMethod, record } =
      body;

    const response = await this.twilioService.makeCallWithTwiML(
      to,
      twiml,
      from,
      statusCallback,
      statusCallbackMethod,
      record,
    );

    return {
      status: 'success',
      message: 'Call initiated successfully',
      data: response,
    };
  }

  @Get('twilio/calls/:sid')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async getTwilioCall(@Param('sid') sid: string) {
    const call = await this.twilioService.getCall(sid);
    return {
      status: 'success',
      message: 'Call fetched successfully',
      data: call,
    };
  }

  @Patch('twilio/calls/:sid')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async updateTwilioCall(
    @Param('sid') sid: string,
    @Body() body: UpdateCallStatusDto,
  ) {
    const call = await this.twilioService.updateCall(sid, body.status);
    return {
      status: 'success',
      message: 'Call updated successfully',
      data: call,
    };
  }

  /**
   * TwiML Voice URL handler for Twilio calls
   * This endpoint must be publicly accessible (no auth) and return valid TwiML
   * Configure this URL in your Twilio Console TwiML App settings:
   * https://console.twilio.com/us1/develop/voice/manage/twiml-apps
   *
   * The Voice URL should be: https://your-domain.com/services/twilio/call-handler
   */
  @Post('twilio/call-handler')
  async handleTwilioCall(@Req() req: Request, @Res() res: Response) {
    console.log('🚀 ~ ServicesController ~ handleTwilioCall ~ req:', req);
    try {
      // Extract call parameters from Twilio request
      const callSid = req.body?.CallSid || req.query?.CallSid;
      const from = req.body?.From || req.query?.From;
      const to = req.body?.To || req.query?.To;
      const callStatus = req.body?.CallStatus || req.query?.CallStatus;

      // Log the incoming TwiML request for debugging
      console.log('TwiML Request:', {
        callSid,
        from,
        to,
        callStatus,
        body: req.body,
        query: req.query,
      });

      // Basic TwiML response for client-to-client calls
      // Customize this based on your call flow requirements
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call.</Say>
  <Dial>
    <Client>
      <Identity>${to || 'user'}</Identity>
    </Client>
  </Dial>
</Response>`;

      res.type('text/xml');
      res.send(twiml);
    } catch (error) {
      console.error('Error in TwiML handler:', error);
      // Return error TwiML
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, there was an error processing your call.</Say>
  <Hangup/>
</Response>`;
      res.type('text/xml');
      res.status(200).send(errorTwiml);
    }
  }
}
