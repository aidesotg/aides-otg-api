import { Imail } from '../interface/imail.interface';
import * as dotenv from 'dotenv';

dotenv.config();
class PlainMail implements Imail {
  public email: string;
  public body: any;
  public subject: string;
  public user: any;
  public message: string;
  public template: string;
  public details: string;

  constructor(
    email: string,
    subject = '',
    details = '',
    user: any,
    message: string,
  ) {
    this.email = email;
    this.subject = subject;
    this.user = user;
    this.message = message;
    this.details = details;
    this.template = 'default';
  }

  setBody() {
    this.body = {
      body: {
        title: `Hi ${this.user.first_name} ${this.user.last_name}`,
        intro: [`${this.message}`, `${this.details}`],
      },
    };

    return this.body;
  }
}

export default PlainMail;
