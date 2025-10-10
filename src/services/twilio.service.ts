import { Injectable } from '@nestjs/common';
import { Imail } from './mailers/interface/imail.interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_AUTH_TOKEN;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const client = require('twilio')(accountSid, authToken);

@Injectable()
export class Twilio {
  // public twilio = client;
  async send(message: string, phone: string) {
    try {
      client.messages
        .create({
          body: message,
          from: 'whatsapp:+14155238886',
          to: `whatsapp:+2348100612255`,
        })
        .then((message) => console.log(message.sid))
        .done();
    } catch (error) {
      console.log(error);
    }
  }
}
