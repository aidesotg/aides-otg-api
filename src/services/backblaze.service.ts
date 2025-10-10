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
}
