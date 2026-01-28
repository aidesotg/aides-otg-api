import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CallRecording } from 'src/modules/service-request/interface/call-recording.interface';
import { ServiceRequestDayLogs } from 'src/modules/service-request/interface/service-request-day-logs.schema';
import { Twilio } from 'twilio';
import * as twilio from 'twilio';
import axios from 'axios';

@Injectable()
export class TwilioService {
  private twilioClient: Twilio;
  private readonly logger = new Logger(TwilioService.name);

  constructor
    (@InjectModel('CallRecording') private readonly callRecordingModel: Model<CallRecording>,
      @InjectModel('ServiceRequestDayLogs') private readonly serviceRequestDayLogsModel: Model<ServiceRequestDayLogs>,
      private configService: ConfigService) {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );

  }

  async sendSMS(to: string, message: string) {
    try {
      const response = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: to,
      });

      this.logger.log(`SMS sent successfully. SID: ${response.sid}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`);
      throw error;
    }
  }

  async sendWhatsApp(to: string, message: string) {
    try {
      const response = await this.twilioClient.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`,
      });

      this.logger.log(
        `WhatsApp message sent successfully. SID: ${response.sid}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
      throw error;
    }
  }

  // For bulk marketing messages
  async sendBulkMessages(
    recipients: string[],
    message: string,
    channel: 'sms' | 'whatsapp',
  ) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const response =
          channel === 'sms'
            ? await this.sendSMS(recipient, message)
            : await this.sendWhatsApp(recipient, message);

        results.push({ recipient, status: 'success', sid: response.sid });
      } catch (error) {
        results.push({ recipient, status: 'failed', error: error.message });
      }
    }

    return results;
  }

  async makeCall(
    to: string,
    from?: string,
    url?: string,
    method?: 'GET' | 'POST',
    statusCallback?: string,
    statusCallbackMethod?: 'GET' | 'POST',
    record?: boolean,
  ) {
    try {
      const callOptions: any = {
        to: to,
        from: from || process.env.TWILIO_WHATSAPP_NUMBER,
      };

      // If URL is provided, use it for TwiML instructions
      if (url) {
        callOptions.url = url;
      } else {
        // Default TwiML URL if APP_URL is configured
        const appUrl = process.env.APP_URL;
        if (appUrl) {
          callOptions.url = `${appUrl}/twilio/call-handler`;
        } else {
          throw new Error(
            'Either URL parameter or APP_URL environment variable must be provided',
          );
        }
      }

      // Optional parameters
      if (method) {
        callOptions.method = method;
      }

      if (statusCallback) {
        callOptions.statusCallback = statusCallback;
      }

      if (statusCallbackMethod) {
        callOptions.statusCallbackMethod = statusCallbackMethod;
      }

      if (record !== undefined) {
        callOptions.record = record;
      }

      const response = await this.twilioClient.calls.create(callOptions);

      this.logger.log(`Call initiated successfully. Call SID: ${response.sid}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to make call: ${error.message}`);
      throw error;
    }
  }

  async makeCallWithTwiML(
    to: string,
    twiml: string,
    from?: string,
    statusCallback?: string,
    statusCallbackMethod?: 'GET' | 'POST',
    record?: boolean,
  ) {
    try {
      const callOptions: any = {
        to: to,
        from: from || process.env.TWILIO_WHATSAPP_NUMBER,
        twiml: twiml,
      };

      if (statusCallback) {
        callOptions.statusCallback = statusCallback;
      }

      if (statusCallbackMethod) {
        callOptions.statusCallbackMethod = statusCallbackMethod;
      }

      if (record !== undefined) {
        callOptions.record = record;
      }

      const response = await this.twilioClient.calls.create(callOptions);

      this.logger.log(
        `Call with TwiML initiated successfully. Call SID: ${response.sid}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Failed to make call with TwiML: ${error.message}`);
      throw error;
    }
  }

  async getCall(callSid: string) {
    try {
      const call = await this.twilioClient.calls(callSid).fetch();
      this.logger.log(`Call retrieved successfully. Call SID: ${call.sid}`);
      return call;
    } catch (error) {
      this.logger.error(`Failed to get call: ${error.message}`);
      throw error;
    }
  }

  async updateCall(callSid: string, status: 'canceled' | 'completed') {
    try {
      const call = await this.twilioClient.calls(callSid).update({ status });
      this.logger.log(`Call updated successfully. Call SID: ${call.sid}`);
      return call;
    } catch (error) {
      this.logger.error(`Failed to update call: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a Twilio JWT access token for client-side use
   * @param identity - Unique identifier for the user (e.g., user ID, email, or username)
   * @param grants - Optional grants for Voice, Video, Chat, etc.
   * @returns JWT token string
   */
  generateAccessToken(
    identity: string,
    grants?: {
      voice?: {
        incomingAllow?: boolean;
        outgoingAllow?: boolean;
        twimlAppSid?: string;
      };
      video?: {
        room?: string;
      };
      chat?: {
        serviceSid?: string;
      };
    },
  ): string {
    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const apiKey = process.env.TWILIO_API_KEY_SID;
      const apiSecret = process.env.TWILIO_API_KEY_SECRET;

      if (!accountSid || !apiKey || !apiSecret) {
        throw new Error(
          'Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET) are required to generate access token',
        );
      }

      const AccessToken = twilio.jwt.AccessToken;
      const token = new AccessToken(accountSid, apiKey, apiSecret, {
        identity: identity,
        ttl: 3600, // Token expires in 1 hour (default)
      });

      // Add Voice grant if provided
      if (grants?.voice) {
        const VoiceGrant = twilio.jwt.AccessToken.VoiceGrant;

        const twimlAppSid =
          grants.voice.twimlAppSid || process.env.TWILIO_TWIML_APP_SID;

        if (!twimlAppSid) {
          throw new Error(
            'TWILIO_TWIML_APP_SID is required for Voice grants. Please set it in environment variables or pass it in the grants parameter.',
          );
        }

        // Validate TwiML App SID format (should start with AP)
        if (!twimlAppSid.startsWith('AP')) {
          this.logger.warn(
            `TwiML App SID "${twimlAppSid}" may be invalid. TwiML App SIDs typically start with "AP".`,
          );
        }

        // Log the TwiML App SID being used for debugging
        this.logger.log(
          `Using TwiML App SID: ${twimlAppSid} for Voice grant. Ensure this TwiML App exists in your Twilio Console and has a valid Voice URL configured.`,
        );

        const voiceGrant = new VoiceGrant({
          outgoingApplicationSid: twimlAppSid,
          incomingAllow: grants.voice.incomingAllow ?? true,
        });

        token.addGrant(voiceGrant);
      }

      // Add Video grant if provided
      if (grants?.video) {
        const VideoGrant = twilio.jwt.AccessToken.VideoGrant;
        const videoGrant = new VideoGrant({
          room: grants.video.room,
        });
        token.addGrant(videoGrant);
      }

      // Add Chat grant if provided
      if (grants?.chat) {
        const ChatGrant = twilio.jwt.AccessToken.ChatGrant;
        const chatGrant = new ChatGrant({
          serviceSid: grants.chat.serviceSid,
        });
        token.addGrant(chatGrant);
      }

      const jwtToken = token.toJwt();
      this.logger.log(
        `Twilio access token generated for identity: ${identity}`,
      );
      return jwtToken;
    } catch (error) {
      this.logger.error(
        `Failed to generate Twilio access token: ${error.message}`,
      );
      throw error;
    }
  }

  // async sendWhatsAppTemplate(
  //   to: string,
  //   templateName: string,
  //   components: {
  //     type: 'body' | 'header' | 'button';
  //     parameters: Array<{
  //       type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
  //       text?: string;
  //       currency?: { code: string; amount: number };
  //       date_time?: { date_time: string };
  //       image?: { link: string };
  //       document?: { link: string };
  //     }>;
  //   }[],
  // ) {
  //   try {
  //     const response = await this.twilioClient.messages.create({
  //       from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER')}`,
  //       to: `whatsapp:${to}`,
  //       contentSid: templateName,
  //       contentVariables: JSON.stringify(components),
  //     });

  //     this.logger.log(
  //       `WhatsApp template sent successfully. SID: ${response.sid}`,
  //     );
  //     return response;
  //   } catch (error) {
  //     this.logger.error(`Failed to send WhatsApp template: ${error.message}`);
  //     throw error;
  //   }
  // }

  async handleCallRecordingCallback(body: any) {
    const dayLog = await this.serviceRequestDayLogsModel.findOne({
      call_sids: { $in: [body.CallSid] }
    })
    if (dayLog) {
      const newRecording = new this.callRecordingModel({
        dayLog: dayLog._id,
        day_id: dayLog.day_id,
        recording_url: body.RecordingUrl,
        call_sid: body.CallSid,
        recording_duration: body.RecordingDuration,
        recording_status: body.RecordingStatus,
      })

      let response;
      if (body.RecordingStatus === 'completed') {
        try {
          response = await axios.get(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Recordings/${body.RecordingSid}.mp3?RequestedChannels=1`,
            {
              headers: {
                'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_API_KEY_SID}:${process.env.TWILIO_API_KEY_SECRET}`).toString('base64')}`
              }
            }
          );
          // return response.data.data;
        } catch (err) {
          console.log("🚀 ~ TwilioService ~ handleCallRecordingCallback ~ err:", err)
        }
        if (response) {
          // const base64 = Buffer.from(response.data).toString('base64');
          // const url = await this.awsService.uploadFile(base64, `call-recordings/${body.RecordingSid}.mp3`);
          newRecording.recording_url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Recordings/${body.RecordingSid}.mp3?RequestedChannels=1`;
          await newRecording.save();
        }
      }
    }
  }
}
