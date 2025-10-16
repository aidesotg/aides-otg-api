import { Imail } from '../interface/imail.interface';
import * as dotenv from 'dotenv';

dotenv.config();
class ResendActivationMail implements Imail {
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
        title: `Hi ${this.user.first_name} ${this.user.last_name}`,
        intro: [
          `please use this token to complete your registration, token expires in 4 hours`,
          `<b>${this.token}</b>`,
        ],
      },
    };

    return this.body;
  }
}

export default ResendActivationMail;
