import * as AWS from 'aws-sdk';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const SES_CONFIG = {
  accessKeyId: '<SES IAM user access key>',
  secretAccessKey: '<SES IAM user secret access key>',
  region: 'us-west-2',
  apiVersion: '2010-12-01',
};

const AWS_SES = new AWS.SES(SES_CONFIG);

export default AWS_SES;
