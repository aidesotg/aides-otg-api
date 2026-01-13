import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/modules/user/interface/user.interface';
import { Session } from 'src/modules/authentication/interface/session.interface';

dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Session') private sessionModel: Model<Session>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.SECRET,
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: any): Promise<any> {
    // Extract token from request headers
    const authHeader = request.headers ? request.headers.authorization : '';
    const token = authHeader ? authHeader.replace('Bearer ', '') : '';

    if (!token) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Token not provided',
      });
    }

    // Terminate session and block access if token is expired
    if (payload && payload.exp && Date.now() / 1000 > payload.exp) {
      await this.sessionModel.deleteOne({ jwt_token: token }).exec();
      throw new UnauthorizedException({
        status: 'error',
        message: 'Your current login session has expired',
      });
    }

    // Check if token exists in session model
    const session = await this.sessionModel
      .findOne({ jwt_token: token })
      .exec();

    if (!session) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Invalid or expired session. Please login again.',
      });
    }

    // Validate user
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

    // Update session last_login
    session.last_login = new Date();
    await session.save();

    return user;
  }
}
