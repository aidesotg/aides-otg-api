import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/modules/user/interface/user.interface';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel('User') private userModel: Model<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET,
    });
  }

  async validate(payload: any): Promise<any> {
    const user = await this.userModel
      .findOne({ _id: payload.id, isDeleted: false })
      .populate('roles', ['name']);
    if (!user) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Your current login session has expired',
      });
    }
    if (user.status === 'suspended') {
      throw new UnauthorizedException({
        status: 'error',
        message:
          'Your account is currently suspended, please contact admin or customer support for more information',
      });
    }
    user.last_login = new Date();
    await user.save();
    return user;
  }
}
