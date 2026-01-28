import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import b2 from './config/backblaze.config';

@Injectable()
export class BackblazeService {
  async getBucket() {
    try {
      await b2.authorize(); // must authorize first (authorization lasts 24 hrs)
      const response = await b2.getBucket({ bucketName: 'my-bucket' });
      console.log(response.data);
    } catch (err) {
      console.log('Error getting bucket:', err);
    }
  }

  // async getSignedUrl(file_name: string, file_type: string) {}

  // async getSignedUrl(file_name: string, file_type: string) {}
  async upload() {
    try {
      await b2.authorize(); // must authorize first (authorization lasts 24 hrs)
      const response = await b2.getUploadUrl({ bucketId: 'my-bucket' });
      console.log(response.data);
      return;
    } catch (err) {
      console.log('Error getting bucket:', err);
      return;
    }
  }

  async uploadToB2(file, buffer) {
    try {
      await b2.authorize();
      // access bucket   j

      const bucket = await b2.getBucket({
        bucketName: process.env.BACKBLAZE_BUCKET,
      });
      // console.log('🚀 ~ BackblazeService ~ uploadToB2 ~ bucket:', bucket);

      const uploadURL = await b2.getUploadUrl({
        bucketId: bucket.data.buckets[0].bucketId,
      });
      // console.log('🚀 ~ BackblazeService ~ uploadToB2 ~ uploadURL:', uploadURL);

      const file_name = `${Date.now()}-${file.originalname}`;

      const uploaded = await b2.uploadFile({
        uploadUrl: uploadURL.data.uploadUrl,
        uploadAuthToken: uploadURL.data.authorizationToken,
        fileName: file_name,
        mime: file.mimetype,
        data: buffer,
      });
      console.log(
        '🚀 ~ BackblazeService ~ uploadToB2 ~ uploaded:',
        uploaded?.data,
      );

      const thefile = `https://${process.env.BACKBLAZE_BUCKET}.${process.env.BACKBLAZE_REGION}.backblazeb2.com/${uploaded.data.fileName}`;
      // console.log("the fiele vd::: ", thefile);
      return thefile;
    } catch (e) {
      console.log('Error from B@2', e);
    }
  }
}
