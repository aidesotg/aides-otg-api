import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { PasswordResetDto } from 'src/modules/user/dto/password-reset.dto';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { AuthenticationService } from '../services/authentication.service';
import { LoginDto } from '../dto/login.dto';
import { RegistrationDto } from '../dto/registration.dto';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import {
  TwoFactorLoginRequestDto,
  TwoFactorLoginVerificationDto,
} from '../dto/2fa-auth.dto';
import { SocialSignInDto } from '../dto/social-signin.dto';
import { SocialAuthService } from '../services/social-auth.service';
@ApiTags('auth')
@Controller('auth')
export class AuthenticationController {
  constructor(private authenticationService: AuthenticationService) {}

  @Post('/social/login')
  @HttpCode(HttpStatus.OK)
  public async socialLogin(@Body() socialSignInDto: SocialSignInDto) {
    try {
      return this.authenticationService.signInSocial(socialSignInDto);
    } catch (err) {
      console.log('🚀 ~ AuthController ~ err:', err);
      throw new ForbiddenException({
        status: 'error',
        message: 'Authentication failed',
      });
    }
  }

  @Post('/register')
  @UseFilters(ExceptionsLoggerFilter)
  async register(@Body() registerDto: RegistrationDto) {
    return this.authenticationService.register(registerDto);
  }

  @Post('/login')
  @UseFilters(ExceptionsLoggerFilter)
  async login(@Body() loginDto: LoginDto) {
    return this.authenticationService.login(loginDto);
  }
  @Post('/login/two-factor')
  @UseFilters(ExceptionsLoggerFilter)
  async twoFactorLogin(@Body() body: TwoFactorLoginRequestDto) {
    return this.authenticationService.twoFactorLogin(body);
  }

  @Post('/login/two-factor/verify')
  @UseFilters(ExceptionsLoggerFilter)
  async twoFactorLoginVerification(
    @Body() body: TwoFactorLoginVerificationDto,
  ) {
    return this.authenticationService.twoFactorLoginVerification(body);
  }

  @Post('/social')
  @HttpCode(HttpStatus.OK)
  public async social(@Body() socialSignInDto: SocialSignInDto) {
    try {
      return this.authenticationService.signInSocial(socialSignInDto);
    } catch (err) {
      console.log('🚀 ~ AuthController ~ err:', err);
      throw new ForbiddenException({
        status: 'error',
        message: 'Authentication failed',
      });
    }
  }

  @Get('/roles')
  @UseFilters(ExceptionsLoggerFilter)
  async getRoles() {
    return this.authenticationService.getRolesPublic();
  }

  @Post('/admin/login/')
  @UseFilters(ExceptionsLoggerFilter)
  async loginAdmin(@Body() loginDto: LoginDto) {
    return this.authenticationService.login(loginDto, 'admin');
  }

  @Get('/verify/:token')
  @UseFilters(ExceptionsLoggerFilter)
  async verify(@Param('token') token: string) {
    return this.authenticationService.verify(token);
  }

  @Get('/verify-admin/:token')
  @UseFilters(ExceptionsLoggerFilter)
  async verifyAdmin(@Param('token') token: string) {
    return this.authenticationService.verifyAdmin(token);
  }

  @Put('/resend-verification')
  @UseFilters(ExceptionsLoggerFilter)
  async resendVerification(@Body('email') email: string) {
    return this.authenticationService.resendVerification(email);
  }

  @Post('/password-request')
  @UseFilters(ExceptionsLoggerFilter)
  async passwordRequest(@Body('email') email: string) {
    return this.authenticationService.passwordResetRequest(email);
  }

  @Put('/password-reset')
  @UseFilters(ExceptionsLoggerFilter)
  async PasswordReset(@Body() body: PasswordResetDto) {
    return this.authenticationService.passwordReset(body);
  }

  @Put('/logout')
  @UseFilters(ExceptionsLoggerFilter)
  @UseGuards(AuthGuard('jwt'))
  async Logout(
    @AuthUser() user: any,
    @Body('device_token') device_token: string,
  ) {
    return this.authenticationService.logout(user, device_token);
  }
}
