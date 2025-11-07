import {
  Injectable,
  HttpException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import moment from 'moment';
import * as otpGenerator from 'otp-generator';
import { LoginDto } from 'src/modules/authentication/dto/login.dto';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/modules/user/interface/user.interface';
import { RoleService } from 'src/modules/role/services/role.service';
import { Mailer } from 'src/services/mailer.service';
import RegistrationMail from 'src/services/mailers/templates/registration-mail';
import ResendActivationMail from 'src/services/mailers/templates/resend-activation';
import { PasswordReset } from 'src/modules/user/interface/password-reset.interface';
import PasswordRequestMail from 'src/services/mailers/templates/password-request-mail';
import { PasswordResetDto } from 'src/modules/user/dto/password-reset.dto';
import { RegistrationDto } from 'src/modules/authentication/dto/registration.dto';
import { AdminLogin } from 'src/modules/authentication/interface/admin-login.interface';
import AdminLoginMail from 'src/services/mailers/templates/admin-login-mail';
import { FirebaseService } from 'src/services/firebase.service';
import { Role } from 'src/modules/role/interface/role.interface';
import { WalletService } from 'src/modules/wallet/services/wallet.service';
import { MiscCLass } from 'src/services/misc.service';
import { UserService } from 'src/modules/user/services/user.service';
import {
  TwoFactorLoginRequestDto,
  TwoFactorLoginVerificationDto,
} from '../dto/2fa-auth.dto';
import { SocialSignInDto } from '../dto/social-signin.dto';
import { SocialAuthService } from './social-auth.service';

dotenv.config();

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Role') private roleModel: Model<Role>,
    @InjectModel('PasswordReset')
    private passwordResetModel: Model<PasswordReset>,
    @InjectModel('AdminLogin') private adminLoginModel: Model<AdminLogin>,
    private roleService: RoleService,
    private mailerService: Mailer,
    private firebaseService: FirebaseService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private miscService: MiscCLass,
    private socialAuthService: SocialAuthService,
  ) {}

  async signInSocial(payload: SocialSignInDto) {
    try {
      const { auth, socialPayload, newUser } =
        await this.socialAuthService.socialSignIn(payload);

      return await this.signInUser(auth, payload, newUser);
    } catch (error) {
      throw error;
    }
  }

  async signInUser(
    user: User,
    data: LoginDto | SocialSignInDto,
    newUser?: boolean,
  ) {
    // user.last_login = new Date();
    if (data.device_token && !user.device_token.includes(data.device_token)) {
      user.device_token.push(data.device_token);
      await user.save();
      await this.firebaseService.subscribeToTopic(data.device_token, 'general');
    }
    await user.save();

    const expire = 2592000;
    const token = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      process.env.SECRET,
      { expiresIn: expire },
    );

    return {
      status: 'success',
      message: 'Login successful',
      data: {
        user,
        token: `Bearer ${token}`,
        expires_in: expire,
      },
    };
  }

  async register(body: RegistrationDto) {
    console.log(
      '🚀 ~ AuthenticationService ~ register ~ RegistrationDto:',
      RegistrationDto,
    );
    const { email, password, phone } = body;
    const pass = bcrypt.hashSync(password.replaceAll(' ', ''), 11);
    // const phoneNum = `+234${phone}`;

    const role = await this.roleModel.findOne({ name: 'Client' });
    if (!role) {
      throw new NotFoundException({
        status: 'error',
        message: 'Role not found',
      });
    }
    const activation_code = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      specialChars: false,
      upperCase: false,
    });
    const expire = moment().add(4, 'hours').format('YYYY-MM-DD HH:mm:ss');

    const data: any = {
      email: email.toLowerCase(),
      password: pass,
      phone,
      roles: [role._id],
      activation_code,
      activation_expires_in: expire,
    };

    const newUser = new this.userModel(data);

    const user = await newUser.save();

    this.mailerService.send(
      new RegistrationMail(email, 'Registration', user, activation_code),
    );

    return {
      status: 'success',
      message:
        'A verification OTP has been sent to your email to complete your registration, OTP expires in 4 hours',
    };
  }

  async login(loginDto: LoginDto, route?: string) {
    const { email, password, device_token } = loginDto;
    const user: any = await this.userModel
      .findOne({
        email: email.toLowerCase(),
        isDeleted: false,
      })
      .populate('roles', ['name'])
      .populate('has_applied')
      .exec();
    if (!user) {
      throw new HttpException(
        { status: 'error', message: 'Invalid login credentials' },
        404,
      );
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) {
      throw new HttpException(
        { status: 'error', message: 'Incorrect login credentials' },
        401,
      );
    }

    if (user.status === 'inactive') {
      const { message } = await this.resendVerification(user.email);
      throw new HttpException(
        {
          status: 'error',
          message,
        },
        403,
      );
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedException({
        status: 'error',
        message:
          'Your account is currently suspended, please contact admin or customer support for more information',
      });
    }

    if (device_token && !user.device_token.includes(device_token)) {
      user.device_token.push(device_token);
      await user.save();
      await this.firebaseService.subscribeToTopic(device_token, 'general');
    }

    await this.walletService.createWallet(user, user.email);

    //check if it's an admin trying to login
    if (route && route === 'admin') {
      let isSuperAdmin = false;
      for (const role of user.roles) {
        if (role.name === 'Super Admin') {
          isSuperAdmin = true;
          break;
        }
      }
      if (!isSuperAdmin) {
        throw new UnauthorizedException({
          status: 'error',
          message: 'Unauthorized',
        });
      }
      let code = null;

      const codeExist = await this.adminLoginModel
        .findOne({ userId: user._id, used: false })
        .exec();

      if (codeExist) {
        const time = new Date().getTime();
        const expires_in = new Date(codeExist.expiry).getTime();

        if (time < expires_in) {
          code = codeExist.token;
        } else {
          codeExist.used = true;
          await codeExist.save();
        }
      }

      if (!codeExist || codeExist.used) {
        code = otpGenerator.generate(6, {
          digits: true,
          alphabets: false,
          specialChars: false,
          upperCase: false,
        });
        const expires = moment().add(4, 'hours').format('YYYY-MM-DD HH:mm:ss');

        const adminLoginRequest = new this.adminLoginModel({
          userId: user._id,
          token: code,
          expiry: new Date(expires),
          used: false,
        });

        await adminLoginRequest.save();
      }

      this.mailerService.send(
        new AdminLoginMail(user.email, 'New login attempt', user, code),
      );

      return {
        status: 'success',
        message:
          'A token has been sent to your email to complete your login attempt, token expires in 4 hours',
      };
    } else {
      //check if 2FA is setup
      if (
        user.twoFactorEnabled.sms ||
        user.twoFactorEnabled.google_authenticator
      ) {
        return {
          status: 'success',
          message:
            'You have 2FA setup on your account, please select a method to login',
          data: {
            user: { _id: user._id, twoFactorEnabled: user.twoFactorEnabled },
          },
        };
      }

      const expire = 2592000;
      const token = jwt.sign(
        { id: user.id, email: user.email, roles: user.roles },
        process.env.SECRET,
        { expiresIn: expire },
      );

      const data = {
        user,
        token: `Bearer ${token}`,
        expires_in: expire,
      };
      return {
        status: 'success',
        message: 'Login successful',
        data,
      };
    }
  }

  async twoFactorLogin(body: TwoFactorLoginRequestDto) {
    if (body.method === 'sms') {
      const userDetails = await this.userModel.findOne({ _id: body.userId });
      if (!userDetails) {
        throw new NotFoundException({
          status: 'error',
          message: 'user not found',
        });
      }
      const token = this.miscService.generateRandomNumber(6);
      userDetails.twoFactorSmsToken = token;
      await userDetails.save();

      // TODO: Send SMS with token
      return {
        status: 'success',
        message: 'Enter the token sent to your phone to complete your login',
        data: {
          token,
        },
      };
    }
    if (body.method === 'google_authenticator') {
      return {
        status: 'success',
        message:
          'Enter the code from your authenticator app to complete your login',
        data: {},
      };
    }
  }

  async twoFactorLoginVerification(body: TwoFactorLoginVerificationDto) {
    const user = await this.userModel
      .findOne({ _id: body.userId })
      .populate('roles', ['name'])
      .populate('has_applied')
      .exec();
    if (!user) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    if (body.method === 'sms') {
      if (user.twoFactorSmsToken !== body.token) {
        throw new BadRequestException({
          status: 'error',
          message: 'Invalid token',
        });
      }
      user.twoFactorSmsToken = null;
      await user.save();
    }
    if (body.method === 'google_authenticator') {
      await this.userService.verifyGoogleTwoFactorToken(user, {
        token: body.token,
      });
    }

    const expire = 2592000;
    const token = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      process.env.SECRET,
      { expiresIn: expire },
    );

    const data = {
      user,
      token: `Bearer ${token}`,
      expires_in: expire,
    };
    return {
      status: 'success',
      message: 'Login successful',
      data,
    };
  }

  async verifyAdmin(token: string) {
    const loginAttempt = await this.adminLoginModel
      .findOne({ token, used: false })
      .exec();

    if (!loginAttempt) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid token',
      });
    }

    const time = new Date().getTime();
    const expires_in = new Date(loginAttempt.expiry).getTime();

    if (time > expires_in) {
      throw new BadRequestException({
        status: 'error',
        message: 'token has expired',
      });
    }

    loginAttempt.expiry = null;
    loginAttempt.used = true;
    loginAttempt.date = new Date();

    await loginAttempt.save();

    const user: any = await this.userModel
      .findOne({ _id: loginAttempt.userId })
      .populate('roles', ['name'])
      .exec();

    const expire = 2592000;
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.SECRET,
      { expiresIn: expire },
    );

    const data = {
      user,
      token: `Bearer ${jwtToken}`,
      expires_in: expire,
    };

    return {
      status: 'success',
      message: 'login successfull',
      data,
    };
  }

  async verify(token: string) {
    const user = await this.userModel
      .findOne({ activation_code: token, isDeleted: false })
      .populate('role')
      .exec();

    if (!user) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid token',
      });
    }

    const time = new Date().getTime();
    const expires_in = new Date(user.activation_expires_in).getTime();

    if (time > expires_in) {
      throw new BadRequestException({
        status: 'error',
        message: 'Ooops, Your acivation token has expired',
      });
    }

    user.activation_code = null;
    user.activation_expires_in = null;
    user.status = 'active';

    await user.save();

    const expire = 2592000;
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, roles: user.roles },
      process.env.SECRET,
      { expiresIn: expire },
    );

    const data = {
      user,
      token: `Bearer ${jwtToken}`,
      expires_in: expire,
    };

    return {
      status: 'success',
      message: 'Account verification successful',
      data,
    };
  }

  async resendVerification(email: string) {
    let activation_code = null;
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException({
        status: 'error',
        message: 'Account with email does not exists',
      });
    }

    //check if user already has existing OTP that hasn't expired
    let expired = false;
    if (user.activation_code) {
      const time = new Date().getTime();
      const expires_in = new Date(user.activation_expires_in).getTime();

      if (time < expires_in) {
        activation_code = user.activation_code;
      } else {
        expired = true;
      }
    }

    if (!user.activation_code || expired) {
      activation_code = otpGenerator.generate(6, {
        digits: true,
        alphabets: false,
        specialChars: false,
        upperCase: false,
      });
      const expire = moment().add(4, 'hours').format('YYYY-MM-DD HH:mm:ss');

      user.activation_code = activation_code;
      user.activation_expires_in = new Date(expire);
      await user.save();
    }
    console.log(activation_code);
    this.mailerService.send(
      new ResendActivationMail(
        email,
        'Account Verification',
        user,
        activation_code,
      ),
    );

    return {
      status: 'success',
      message:
        'A verification OTP has been re-sent to your email to complete you registration, OTP expires in 4 hours',
    };
  }

  async passwordResetRequest(email: string) {
    let code = null;
    const user = await this.userModel
      .findOne({ email, isDeleted: false })
      .exec();
    if (!user) {
      throw new NotFoundException({
        status: 'error',
        message: 'Account not found',
      });
    }

    const codeExist = await this.passwordResetModel
      .findOne({ email, used: false })
      .exec();

    if (codeExist) {
      code = codeExist.token;
    } else {
      code = otpGenerator.generate(6, {
        digits: true,
        alphabets: false,
        specialChars: false,
        upperCase: false,
      });
      const expires = moment().add(4, 'hours').format('YYYY-MM-DD HH:mm:ss');

      const passwordReset = new this.passwordResetModel({
        email: user.email,
        token: code,
        expiry: new Date(expires),
        used: false,
      });

      await passwordReset.save();
    }

    this.mailerService.send(
      new PasswordRequestMail(email, 'Password reset', user, code),
    );

    return {
      status: 'success',
      message:
        'A password reset token has been sent to your email, token expires in 4 hours',
    };
  }

  async verifyPasswordResetCode(body: PasswordResetDto) {
    const resetRequest = await this.passwordResetModel
      .findOne({ token: body.token })
      .exec();

    if (!resetRequest || resetRequest.used) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid/expired link',
      });
    }

    const time = new Date().getTime();
    const expires_in = new Date(resetRequest.expiry).getTime();

    if (time > expires_in) {
      resetRequest.used = true;
      resetRequest.save();
      throw new BadRequestException({
        status: 'error',
        message: 'Link expired',
      });
    }

    const user = await this.userModel
      .findOne({ email: resetRequest.email, isDeleted: false })
      .exec();

    if (!user) {
      throw new BadRequestException({
        status: 'error',
        message: 'Unable to get account details',
      });
    }

    resetRequest.used = true;
    user.password = bcrypt.hashSync(body.password.replaceAll(' ', ''), 11);

    await resetRequest.save();
    await user.save();

    return {
      status: 'success',
      message: 'Password updated successfully, you can now login',
    };
  }

  async passwordReset(body: PasswordResetDto) {
    const resetRequest = await this.passwordResetModel
      .findOne({ token: body.token })
      .exec();

    if (!resetRequest || resetRequest.used) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid/expired link',
      });
    }

    const time = new Date().getTime();
    const expires_in = new Date(resetRequest.expiry).getTime();

    if (time > expires_in) {
      resetRequest.used = true;
      resetRequest.save();
      throw new BadRequestException({
        status: 'error',
        message: 'Link expired',
      });
    }

    const user = await this.userModel
      .findOne({ email: resetRequest.email, isDeleted: false })
      .exec();

    if (!user) {
      throw new BadRequestException({
        status: 'error',
        message: 'Unable to get account details',
      });
    }

    resetRequest.used = true;
    user.password = bcrypt.hashSync(body.password.replaceAll(' ', ''), 11);

    await resetRequest.save();
    await user.save();

    return {
      status: 'success',
      message: 'Password updated successfully, you can now login',
    };
  }

  async logout(user: any, token: string) {
    const userDetails: any = await this.userModel
      .findOne({ id: user._id, isDeleted: false })
      .exec();
    if (!userDetails) {
      throw new HttpException(
        { status: 'error', message: 'Unable to complete logout' },
        404,
      );
    }

    const tokens = userDetails.device_token.filter((tokn) => tokn != token);
    userDetails.device_token = tokens;

    await userDetails.save();

    await this.firebaseService.unsubscribeToTopic(token, 'general');

    return {
      status: 'success',
      message: 'logged out successfully',
    };
  }

  async getRolesPublic() {
    const roles = await this.roleModel
      .find({ name: { $in: ['Customer', 'Care Giver'] } })
      .select('id name')
      .exec();
    return {
      status: 'success',
      message: 'Roles fetched',
      data: roles,
    };
  }
}
