import * as fbaseadmin from 'firebase-admin';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

fbaseadmin.initializeApp({
  credential: fbaseadmin.credential.cert(serviceAccount),
});

export default fbaseadmin;
