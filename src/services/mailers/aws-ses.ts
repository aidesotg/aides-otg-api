import { IMailers } from './interface/imailer.interface';
import { Imail } from './interface/imail.interface';
import Mailgen from 'mailgen';
import * as dotenv from 'dotenv';
import AWS_SES from '../config/ses-config';

dotenv.config();

class aws_ses implements IMailers {
  async send(mailClass: Imail) {
    const mailGenerator = new Mailgen({
      theme: 'default',
      product: {
        name: 'Taskam',
        link: '#',
      },
    });

    const html = mailGenerator.generate(mailClass.setBody());
    const text = mailGenerator.generatePlaintext(mailClass.setBody());

    let params = {
      Source: 'mail.taskam.io',
      Destination: {
        ToAddresses: [mailClass.email],
      },
      ReplyToAddresses: [],
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: html,
          },
          Text: {
            Charset: 'UTF-8',
            Data: text,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: mailClass.subject,
        },
      },
    };
    let sendPromise = AWS_SES.sendEmail(params).promise();

    // Handle promise's fulfilled/rejected states
    sendPromise
      .then(function (data) {
        console.log(data.MessageId);
      })
      .catch(function (err) {
        console.error(err, err.stack);
      });
  }
}

export default aws_ses;
