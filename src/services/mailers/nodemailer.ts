import { IMailers } from './interface/imailer.interface';
import { Imail } from './interface/imail.interface';
import { nodemailer_config } from '../config/nodemailer.config';
import * as nodemailer from 'nodemailer';
import Mailgen from 'mailgen';
import * as dotenv from 'dotenv';

dotenv.config();
class node_mailer implements IMailers {
  async send(mailclass: Imail) {
    const config = nodemailer_config;
    const transporter = nodemailer.createTransport(config);

    const mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: 'AidesOnTheGo',
        link: '#',
        logo: 'https://aidesotg.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2FLogo%20Coloured.2c1bf4fc.png&w=828&q=75',
        copyright: `© ${new Date().getFullYear()} AidesOnTheGo. All rights reserved.`,
      },
    });

    const body = mailGenerator.generate(mailclass.setBody());
    const text = mailGenerator.generatePlaintext(mailclass.setBody());
    transporter.sendMail(
      {
        from: `"AidesOnTheGo" ${process.env.NODE_MAILER_USER}`,
        to: mailclass.email,
        subject: mailclass.subject || 'No Subject',
        text: text,
        html: body,
      },
      function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      },
    );
  }
}

export default node_mailer;
