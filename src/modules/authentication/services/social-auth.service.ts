import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as _ from 'lodash';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/modules/user/interface/user.interface';
import { SocialAuthToken } from '../interface/social-auth.interface';
import { SocialSignInDto } from '../dto/social-signin.dto';

@Injectable()
export class SocialAuthService {
  constructor(
    @InjectModel('User') protected model: Model<User>,
    @InjectModel('SocialAuthToken')
    protected authTokenModel: Model<SocialAuthToken>,
    private http: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  async socialSignIn(payload: SocialSignInDto) {
    try {
      const { socialType } = payload;
      const socialData = await this.loginSocial({ ...payload });
      if (!socialData.email) {
        throw new BadRequestException({
          status: 'error',
          message: 'Email is required',
        });
      }

      let auth: any;
      let newUser = false;

      // if (socialData.email) {
      auth = await this.model.findOne({
        email: socialData.email,
      });
      // } else if (socialData.id)
      //   auth = await this.model.findOne({
      //     socialId: String(socialData.id),
      //   });
      delete socialData.id;
      delete socialData._id;

      if (!auth) {
        auth = new this.model({
          ...socialData,
        });
        newUser = true;
      }

      console.log('🚀 ~ SocialAuthService ~ socialSignIn ~ auth:', auth);
      const { authObject, socialPayload } = await this.signInSocial(
        socialData,
        auth,
        socialType,
      );
      return {
        auth: authObject,
        socialPayload,
        newUser,
      };
    } catch (e) {
      throw e;
    }
  }

  /**
   * @param {Object} obj social auth type
   * @return {Promise} The result of the find
   */
  async loginSocial({ socialType, accessToken }) {
    let headers = undefined;
    /* Todo : the social authentication auth are not verified properly should be done before production */
    let url = '';
    if (socialType === 'google') {
      url = `${process.env.SOCIAL_GOOGLE_USER_INFO_URL}?access_token=${accessToken}`;
    } else if (socialType === 'apple') {
      return this.verifyAppleIDToken(accessToken);
    }
    return lastValueFrom(this.http.get(url)).then(
      (response) => {
        if (socialType === 'google') {
          response.data.id = response.data.sub;
        }

        console.log('RESPON====', response?.data);
        if (
          (response.data?.data && response.data.data?.id) ||
          (response.data && response.data.id)
        ) {
          return response.data?.data ?? response.data;
        } else {
          throw new ForbiddenException({
            status: 'error',
            message: 'Social authentication failed',
          });
        }
      },
      (err) => {
        console.log('RESPONSESSSS', err.response);
        if (err?.response && err?.response?.data) {
          if (err.response.data.error_description) {
            throw new ForbiddenException({
              status: 'error',
              message: err.response.data.error_description,
            });
          } else if (err?.response?.data?.error) {
            throw new ForbiddenException({
              status: 'error',
              message:
                err.response.data?.error?.message ?? err.response.data?.error,
            });
          }
        }
        throw new InternalServerErrorException({
          status: 'error',
          message: 'Internal server error',
        });
      },
    );
  }

  /**
   * @param {Object} response The access token for verification
   * @param {Object} auth social auth type
   * @param {Object} socialType social auth type
   * @return {Promise} The result of the find
   */
  async signInSocial(response, auth, socialType) {
    let socialData: any = {};
    if (socialType === 'google') {
      socialData = {
        email: response.email || auth.email,
        firstName: auth.firstName || response.given_name,
        lastName: auth.lastName || response.family_name,
        avatar: auth.avatar || response.picture ? response.picture : undefined,
      };
    }
    _.extend(auth, {
      emailVerified: true,
      active: true,
      socialId: response.id,
      socialHandle: response.username,
      socialAuth: true,
      socialAuthType: socialType,
      social: {
        ...auth.socials,
        [socialType]: response.username ?? response.handle,
      },
      ...socialData,
      profile_picture: auth.avatar ?? socialData.avatar,
    });

    if (socialData.email) {
      auth.email = socialData.email;

      _.extend(auth, {
        verifications: {
          ...auth.verifications,
          email: true,
        },
      });
    }
    return {
      authObject: auth,
      socialPayload: socialData,
    };
  }

  async getApplePublicKey(kid: string): Promise<string> {
    try {
      const jwksUrl = `${process.env.SOCIAL_APPLE_JWKS_URL}`;

      const response = await this.http.get(jwksUrl).toPromise();

      const jwks = response.data;
      const key = jwks.keys.find((k) => k.kid === kid);

      if (key) {
        return `-----BEGIN PUBLIC KEY-----\n${key.x5c[0]}\n-----END PUBLIC KEY-----`;
      } else {
        throw new ForbiddenException({
          status: 'error',
          message: 'Public key not found for the given kid.',
        });
      }
    } catch (error) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Failed to fetch JWKS from Apple Identity Service.',
      });
    }
  }

  async verifyAppleIDToken(idToken: string): Promise<any> {
    try {
      const decodedToken = this.jwtService.decode(idToken, { complete: true });

      console.log(
        '🚀 ~ SocialAuthService ~ verifyAppleIDToken ~ decodedToken:',
        decodedToken,
      );
      return decodedToken['payload'];

      const kid = decodedToken['header']['kid'];

      const publicKey = await this.getApplePublicKey(kid);

      // Verify the ID token with the extracted public key
      return this.jwtService.verify(idToken, {
        algorithms: ['RS256'],
        publicKey,
      });
    } catch (error) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Token verification failed: ' + error.message,
      });
    }
  }

  isJWT(str: string) {
    return typeof str === 'string' && str.split('.').length === 3;
  }

  async decodeJWT(token: string) {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
      );
      return decoded;
    } catch (e) {
      return null;
    }
  }
}
