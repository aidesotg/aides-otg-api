import * as AWS from 'aws-sdk';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

AWS.config.update({
  accessKeyId: process.env.BACKBLAZE_APPLICATION_KEY_ID,
  secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY,
  region: process.env.BACKBLAZE_REGION,
});
const ep = new AWS.Endpoint(process.env.BACKBLAZE_ENDPOINT);
const s3: any = new AWS.S3({ endpoint: ep, signatureVersion: 'v4' });

export default s3;
