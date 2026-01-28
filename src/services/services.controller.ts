import {
  Body,
  Controller,
  Delete,
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
import { RedisService } from './redis.service';
import {
  FindCaregiversNearRequestDto,
  FindNearbyCaregiversDto,
  GetDistanceBetweenDto,
  OnlineStatusQueryDto,
  UpdateCaregiverLocationDto,
  UpdateRequestLocationDto,
} from './dto/redis.dto';
import * as twilio from 'twilio';
import { DialRecordingEvent } from 'twilio/lib/twiml/VoiceResponse';

@Controller('services')
export class ServicesController {
  constructor(
    private awsService: AwsService,
    private miscService: MiscCLass,
    private twilioService: TwilioService,
    private redisService: RedisService,
  ) { }

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
   * Redis-powered caregiver location endpoints
   */
  @Post('redis/caregiver/location')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async updateCaregiverLocation(@Body() body: UpdateCaregiverLocationDto) {
    await this.redisService.updateCaregiverLocation(body);
    return {
      status: 'success',
      message: 'Caregiver location updated',
    };
  }

  @Get('redis/caregivers/nearby')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async findNearbyCaregivers(@Query() query: FindNearbyCaregiversDto) {
    const caregivers = await this.redisService.findNearbyCaregivers(
      query.latitude,
      query.longitude,
      query.radius ?? 5,
      query.unit ?? 'km',
    );
    return {
      status: 'success',
      message: 'Nearby caregivers fetched',
      data: caregivers,
    };
  }

  @Get('redis/caregivers/distance')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async getDistanceBetweenCaregivers(@Query() query: GetDistanceBetweenDto) {
    const unit = query.unit ?? 'km';
    const distance = await this.redisService.getDistanceBetween(
      query.caregiverId1,
      query.caregiverId2,
      unit,
    );
    return {
      status: 'success',
      message: 'Distance calculated successfully',
      data: {
        distance,
        unit,
      },
    };
  }

  @Get('redis/caregiver/:id/location')
  @UseGuards(AuthGuard('jwt'))
  async getCaregiverLocation(@Param('id') caregiverId: string) {
    const location = await this.redisService.getCaregiverLocation(caregiverId);
    return {
      status: 'success',
      message: 'Caregiver location fetched',
      data: location,
    };
  }

  @Delete('redis/caregiver/:id/location')
  @UseGuards(AuthGuard('jwt'))
  async removeCaregiverLocation(@Param('id') caregiverId: string) {
    await this.redisService.removeCaregiverLocation(caregiverId);
    return {
      status: 'success',
      message: 'Caregiver location removed',
    };
  }

  @Get('redis/caregiver/:id/online')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async isCaregiverOnline(
    @Param('id') caregiverId: string,
    @Query() query: OnlineStatusQueryDto,
  ) {
    const isOnline = await this.redisService.isCaregiverOnline(
      caregiverId,
      query.maxAge ?? 600,
    );
    return {
      status: 'success',
      message: 'Caregiver online status fetched',
      data: { isOnline },
    };
  }

  @Get('redis/caregivers/online')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async getOnlineCaregivers(@Query() query: OnlineStatusQueryDto) {
    const caregivers = await this.redisService.getAllOnlineCaregivers(
      query.maxAge ?? 600,
    );
    return {
      status: 'success',
      message: 'Online caregivers fetched',
      data: caregivers,
    };
  }

  @Post('redis/requests/:id/location')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async updateRequestLocation(
    @Param('id') requestId: string,
    @Body() body: UpdateRequestLocationDto,
  ) {
    await this.redisService.updateClientLocationForRequest(
      requestId,
      body.latitude,
      body.longitude,
    );
    return {
      status: 'success',
      message: 'Request location updated',
    };
  }

  @Get('redis/requests/:id/location')
  @UseGuards(AuthGuard('jwt'))
  async getRequestLocation(@Param('id') requestId: string) {
    const location = await this.redisService.getClientLocationForRequest(
      requestId,
    );
    return {
      status: 'success',
      message: 'Request location fetched',
      data: location,
    };
  }

  @Delete('redis/requests/:id/location')
  @UseGuards(AuthGuard('jwt'))
  async removeRequestLocation(@Param('id') requestId: string) {
    await this.redisService.removeRequestLocation(requestId);
    return {
      status: 'success',
      message: 'Request location removed',
    };
  }

  @Get('redis/requests/:id/caregivers')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async findCaregiversNearRequest(
    @Param('id') requestId: string,
    @Query() query: FindCaregiversNearRequestDto,
  ) {
    const caregivers = await this.redisService.findCaregiversNearRequest(
      requestId,
      query.radius ?? 10,
    );
    return {
      status: 'success',
      message: 'Nearby caregivers for request fetched',
      data: caregivers,
    };
  }

  @Get('redis/requests/:requestId/caregivers/:caregiverId/distance')
  @UseGuards(AuthGuard('jwt'))
  async calculateDistanceToRequest(
    @Param('requestId') requestId: string,
    @Param('caregiverId') caregiverId: string,
  ) {
    const distance = await this.redisService.calculateDistanceToRequest(
      caregiverId,
      requestId,
    );
    return {
      status: 'success',
      message: 'Distance to request calculated',
      data: { distance },
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
  @Post('voice')
  async handleTwilioCall(@Req() req: Request, @Res() res: Response) {
    console.log('🚀 ~ ServicesController ~ handleTwilioCall ~ req:', req.body);
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
      // timeout: 30 seconds - how long to ring before giving up
      // timeLimit: maximum call duration (optional, defaults to 4 hours)
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting your call.</Say>
  <Dial timeout="30" timeLimit="3600" record="record-from-ringing-dual"
   recordingStatusCallback="https://myapp.com/recording-events"
   recordingStatusCallbackEvent="in-progress completed absent">
    <Client>
      <Identity>${to || 'user'}</Identity>
    </Client>
  </Dial>
  <Say voice="alice">The call could not be completed. Please try again later.</Say>
  <Hangup/>
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

  /**
   * Public Voice webhook for Twilio client or PSTN calls (default target)
   * - If `To` looks like a phone number, dials it with your verified caller ID
   * - Otherwise, treats `To` as a Twilio Client identity
   * Point your TwiML App Voice URL to: https://your-domain.com/services/voice
   */
  @Post('twilio/call-handler')
  async handleVoiceWebhook(@Req() req: Request, @Res() res: Response) {
    console.log(
      '🚀 ~ ServicesController ~ handleVoiceWebhook ~ req:',
      req.body || req.query,
    );

    const toRaw = (req.body?.To || req.query?.To || '').toString();
    const to = toRaw.replace(/^client:/i, '');

    const callerId =
      process.env.TWILIO_CALLER_ID || process.env.TWILIO_WHATSAPP_NUMBER;

    const vr = new twilio.twiml.VoiceResponse();

    if (!to) {
      vr.say('No destination number was provided.');
      return res.type('text/xml').send(vr.toString());
    }

    const looksLikeNumber = /^[\d\+\(\)\-\s]+$/.test(to);

    if (looksLikeNumber) {
      const dial = vr.dial({
        callerId,
        answerOnBridge: true,
        timeout: 30,
        record: 'record-from-ringing-dual',
        recordingStatusCallback: `${process.env.APP_URL}/services/twilio/recording-events`,
        recordingStatusCallbackEvent: [
          'in-progress',
          'completed',
          'absent',
        ] as DialRecordingEvent[],
      });
      dial.number(to);
    } else {
      const dial = vr.dial({
        callerId,
        answerOnBridge: true,
        timeout: 30,
      });
      dial.client(to);
    }

    res.type('text/xml');
    res.send(vr.toString());
  }

  @Post('twilio/recording-events')
  async handleRecordingEvents(@Req() req: Request, @Res() res: Response) {
    console.log('🚀 ~ ServicesController ~ handleRecordingEvents ~ req:', req.body);
    return this.twilioService.handleCallRecordingCallback(req.body);

  }
}
