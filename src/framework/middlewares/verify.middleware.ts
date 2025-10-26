/* eslint-disable prefer-const */
import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class VerificationMiddleware implements NestMiddleware {
  constructor(private userService: UserService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { phone, email } = req.body;
    const query: any = [];

    if (email) {
      query.push({ email });
    }
    if (phone) {
      query.push({ phone });
    }

    const users = await this.userService.verifyUser(query);
    let message = '';

    if (users.length) {
      for (let user of users) {
        if (email && user.email.toLowerCase() == email) {
          message = 'Account with email already exists';
        }

        if (phone && user.phone == phone) {
          message = 'Account with phone already exists';
        }
        // if (username && user.username == username.toLowerCase()) {
        //   message = 'Account with username already exists';
        // }

        throw new BadRequestException({
          status: 'error',
          message,
        });
      }
    }
    next();
  }
}
