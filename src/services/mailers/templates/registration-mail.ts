import { Imail } from '../interface/imail.interface';
import * as dotenv from 'dotenv';

dotenv.config();
class RegistrationMail implements Imail {
  public email: string;
  public body: any;
  public subject: string;
  public user: any;
  public token: string;
  public template: string;
  public WEB_URL: string;

  constructor(email: string, subject: string, user: any, token: string) {
    this.email = email;
    this.body = '';
    this.subject = subject;
    this.user = user;
    this.token = token;
    this.template = 'default';
    this.WEB_URL = process.env.WEB_URL;
  }

  setBody() {
    this.body = {
      body: {
        title: `Hi,`,
        intro: [
          `Thank you for choosing AidesOnTheGo! To complete your registration, please use the verification code below:`,

          `<b>${this.token}</b>`,

          `Enter this code on the verification page to complete your registration.`,
          `This code will expire in 20 minutes.`,

          `Welcome to smarter caregiver services!`,
        ],
        outro: [`Best regards`, `The AidesOnTheGo Team`],
        signature: false,
      },
    };

    return this.body;
  }
}

export default RegistrationMail;
