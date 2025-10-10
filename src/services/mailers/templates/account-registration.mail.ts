import { Imail } from '../interface/imail.interface';
import * as dotenv from 'dotenv';

dotenv.config();
class AccountCreationMail implements Imail {
  public email: string;
  public body: any;
  public subject: string;
  public user: any;
  public credentials: any;
  public template: string;
  public WEB_URL: string;

  constructor(email: string, subject: string, user: any, credentials: any) {
    this.email = email;
    this.body = '';
    this.subject = subject;
    this.user = user;
    this.credentials = credentials;
    this.template = 'default';
    this.WEB_URL = process.env.WEB_URL;
  }

  setBody() {
    this.body = {
      body: {
        title: `Hi ${this.user.fullname.split(' ')[0]}`,
        intro: [
          "Welcome to AidesOnTheGo! We're very excited to have you on board.",
          `An account has just been created for you. please use these credentials to login and validate your account`,
          `<b>email: ${this.credentials.email}</b>`,
          `<b>password: ${this.credentials.password}</b>`,
        ],
      },
    };

    return this.body;
  }
}

export default AccountCreationMail;
