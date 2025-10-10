import B2 from 'backblaze-b2';
import dotenv from 'dotenv';

dotenv.config();

const b2 = new B2({
  applicationKeyId: process.env.BACKBLAZE_APPLICATION_KEY_ID, // or accountId: 'accountId'
  applicationKey: process.env.BACKBLAZE_APPLICATION_KEY, // or masterApplicationKey
});

export default b2;
