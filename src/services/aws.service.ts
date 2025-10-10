import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import s3 from './config/aws.config';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Injectable()
export class AwsService {
  async signUrl(file: any) {
    try {
      const file_name = `counsellme-${Date.now()}${file.file_name}`;
      const file_type = file.file_type;
      const bucket_name = process.env.BACKBLAZE_BUCKET;
      const s3Params = {
        Bucket: bucket_name,
        Key: file_name,
        Expires: 3600,
        // ContentType: file_type,
      };

      const response = await s3.getSignedUrl('putObject', s3Params);

      return {
        status: 'success',
        message: 'Pre-signed url request generated successfully',
        data: {
          signedRequest: response,
          url: `https://${bucket_name}.${process.env.BACKBLAZE_REGION}.backblazeb2.com/${file_name}`,
        },
      };
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException({
        status: 'success',
        message: 'Server error',
      });
    }
  }
}
