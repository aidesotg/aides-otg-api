import { Imail } from '../interface/imail.interface';
import * as dotenv from 'dotenv';

dotenv.config();
class PasswordRequestMail implements Imail {
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
          `You recently requested for a password reset, please use the token below to complete this process`,
          `<b>${this.token}</b>`,
        ],
        outro:
          "If you didn't initiate this request, ignore this mail or contact admin to verify your account status",
      },
    };

    return this.body;
  }
}

export default PasswordRequestMail;
