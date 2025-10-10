import {
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationPipe,
} from '@nestjs/common';

@Injectable()
export class ValidateInputPipe extends ValidationPipe {
  public async transform(value, metadata: ArgumentMetadata) {
    try {
      return await super.transform(value, metadata);
    } catch (e) {
      const message = e.response?.message;
      if (e instanceof BadRequestException) {
        throw new BadRequestException({
          status: 'error',
          message,
        });
      }
    }
  }

  private handleError(errors) {
    return errors.map((error) => error.constraints);
  }
}
