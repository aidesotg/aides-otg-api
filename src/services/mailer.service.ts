import { Injectable } from '@nestjs/common';
import { Imail } from './mailers/interface/imail.interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
@Injectable()
export class Mailer {
  public driver: string;

  async send(mailclass: Imail) {
    // get the selected driver
    try {
      const senderClass = await import(`./mailers/${process.env.MAIL_DRIVER}`);
      const sender = new senderClass.default();
      sender.send(mailclass);
    } catch (error) {
      console.log(error);
    }
  }
}
