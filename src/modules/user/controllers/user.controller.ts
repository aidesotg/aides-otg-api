import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseFilters,
  Query,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../services/user.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import {
  PasswordResetAdmin,
  PasswordResetSelf,
} from '../dto/password-reset.dto';
import {
  CreateProfileDto,
  EmergencyContactDto,
  UpdateEmailDto,
  UpdatePhoneDto,
  UpdatePreferenceDto,
  UpdateProfileDto,
} from '../dto/profile.dto';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '../dto/beneficiary.dto';
import { CreateProfessionalProfileDto } from '../dto/professional-profile.dto';
import { BankDto } from '../dto/bank.dto';
import { NotificationSettingsDto } from '../dto/notification.dto';
import {
  VerifyTwoFactorDto,
  EnableTwoFactorDto,
  DisableTwoFactorDto,
  DisableTwoFactorSmsDto,
  EnableTwoFactorSmsDto,
  SetupTwoFactorSmsDto,
} from '../dto/two-factor-auth.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getUser(@AuthUser() user: any) {
    const userDetails = await this.userService.getUser(user);
    return {
      status: 'success',
      message: 'User details fetched',
      data: { user: userDetails },
    };
  }

  @Get('/bank')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getBanks(@AuthUser() user: any) {
    return this.userService.getBanks(user);
  }

  @Get('/list')
  @UseGuards(AuthGuard('jwt'))
  async getUsers(@Query() params: any) {
    const users = await this.userService.getUsers(params);
    return {
      status: 'success',
      message: 'Users fetched',
      data: users,
    };
  }
  @Post('/check/ssn')
  @UseGuards(AuthGuard('jwt'))
  async checkDuplicateSSN(
    @Body() body: { ssn: string },
    @AuthUser() user: any,
  ) {
    return this.userService.checkDuplicateSSN(user, body.ssn);
  }

  @Post('/check/phone')
  @UseGuards(AuthGuard('jwt'))
  async checkDuplicatePhone(
    @Body() body: { phone: string },
    @AuthUser() user: any,
  ) {
    return this.userService.checkDuplicatePhone(user, body.phone);
  }

  @Post('/create')
  @UseGuards(AuthGuard('jwt'))
  async createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body);
  }

  @Get('/role-count')
  @UseGuards(AuthGuard('jwt'))
  async getUserCount() {
    return this.userService.getUserCountByRoles();
  }

  // @Get('/counsellors')
  // @UseGuards(AuthGuard('jwt'))
  // async getCouncellor(@Query() params: any) {
  //   return this.userService.getUsersByAccountRoles('counsellor', params);
  // }

  @Get('/referrals')
  @UseGuards(AuthGuard('jwt'))
  async getReferrals(@AuthUser() user: any) {
    return this.userService.getUserReferrals(user);
  }

  @Get('/:id/referrals')
  @UseGuards(AuthGuard('jwt'))
  async getReferralsById(@AuthUser() user: any, @Param() params: string) {
    return this.userService.getUserReferrals(user, params);
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getUserById(@Param('id') id: string) {
    const userDetails = await this.userService.getUser({ _id: id });
    return {
      status: 'success',
      message: 'User details fetched',
      data: { user: userDetails },
    };
  }

  @Post('/profile')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async passwordRequest(@Body() body: CreateProfileDto, @AuthUser() user: any) {
    return this.userService.createProfile(user, body);
  }

  @Put('/profile/notification-settings')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateNotificationSettings(
    @Body() body: NotificationSettingsDto,
    @AuthUser() user: any,
  ) {
    return this.userService.updateNotificationSettings(body, user);
  }

  @Post('/bank')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async addBank(@Body() body: BankDto, @AuthUser() user: any) {
    return this.userService.addBank(body, user);
  }

  @Put('/bank/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateBank(
    @Param('id') id: string,
    @Body() body: Partial<BankDto>,
    @AuthUser() user: any,
  ) {
    return this.userService.updateBank(id, body, user);
  }

  @Put('/profile/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateProfile(@Body() body: UpdateProfileDto, @AuthUser() user: any) {
    console.log('🚀 ~ UserController ~ updateProfile ~ body:', body);
    return this.userService.updateProfile(body, user);
  }

  @Put('/profile/update/email')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateEmail(@Body() body: UpdateEmailDto, @AuthUser() user: any) {
    return this.userService.updateEmail(body, user);
  }

  @Put('/profile/update/phone')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updatePhone(@Body() body: UpdatePhoneDto, @AuthUser() user: any) {
    return this.userService.updatePhone(body, user);
  }

  @Put('/profile/update/preference')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updatePreference(
    @Body() body: UpdatePreferenceDto,
    @AuthUser() user: any,
  ) {
    return this.userService.updatePreference(body, user);
  }

  @Post('/profile/add/emergency-contact')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async addEmergencyContact(
    @Body() body: EmergencyContactDto[],
    @AuthUser() user: any,
  ) {
    return this.userService.addEmergencyContact(body, user);
  }
  @Put('/profile/update/emergency-contact/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateEmergencyContact(
    @Param('id') id: string,
    @Body() body: Partial<EmergencyContactDto>,
    @AuthUser() user: any,
  ) {
    return this.userService.editEmergencyContact(id, body, user);
  }

  @Put('/update/:userId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateUser(
    @Body() body: UpdateUserDto,
    @Param('userId') userId: string,
  ) {
    return this.userService.updateUser(userId, body);
  }

  @Delete('/profile/delete/emergency-contact/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteEmergencyContact(@Param('id') id: string, @AuthUser() user: any) {
    return this.userService.deleteEmergencyContact(id, user);
  }

  @Put('/profile/reset-password')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async resetPassword(@Body() body: PasswordResetSelf, @AuthUser() user: any) {
    return this.userService.resetPassword(body, user);
  }

  // @Put('/professional-profile/update')
  // @UseGuards(AuthGuard('jwt'))
  // @UseFilters(ExceptionsLoggerFilter)
  // async updateProfessionalProfile(
  //   @Body() body: ProfessionalProfileDto,
  //   @AuthUser() user: any,
  // ) {
  //   return this.userService.professionalProfile(body, user);
  // }

  @Put('/password/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async passwordUpdateAdmin(@Body() body: PasswordResetAdmin) {
    return this.userService.resetPasswordAdmin(body);
  }

  @Put('/logout')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async logout(@Body() body: { device_token: string }, @AuthUser() user: any) {
    return this.userService.logout(user, body.device_token);
  }

  @Put('/:userId/update-role')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateRole(
    @Param('userId') userId: string,
    @Body('roleId') roleId: string,
  ) {
    return this.userService.updateRole(roleId, userId);
  }

  @Put('/:user/suspend')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async suspendUser(
    @Param('user') user: string,
    @Body('reason') reason: string,
  ) {
    return this.userService.suspendUser(user, reason);
  }

  @Put('/:user/unsuspend')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async unsuspendUser(@Param('user') user: string) {
    return this.userService.unsuspendUser(user);
  }

  @Delete('/bank/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteBank(@Param('id') id: string, @AuthUser() user: any) {
    return this.userService.deleteBank(id, user);
  }

  @Get('/two-factor/google-authenticator/setup')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async generateTwoFactorSecret(@AuthUser() user: any) {
    return this.userService.generateTwoFactorSecret(user);
  }

  @Post('/two-factor/google-authenticator/enable')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async enableTwoFactor(
    @Body() body: EnableTwoFactorDto,
    @AuthUser() user: any,
  ) {
    return this.userService.enableGoogleTwoFactor(user, body);
  }

  @Put('/two-factor/google-authenticator/disable')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async disableTwoFactor(
    @Body() body: DisableTwoFactorDto,
    @AuthUser() user: any,
  ) {
    return this.userService.disableGoogleTwoFactor(user, body);
  }

  @Post('/two-factor/google-authenticator/verify')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async verifyTwoFactor(
    @Body() body: VerifyTwoFactorDto,
    @AuthUser() user: any,
  ) {
    const isValid = await this.userService.verifyGoogleTwoFactorToken(
      user,
      body,
    );
    return {
      status: 'success',
      message: 'Token verified successfully',
      data: { isValid },
    };
  }

  @Post('/two-factor/sms/setup')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async setupTwoFactorSms(
    @AuthUser() user: any,
    @Body() body: SetupTwoFactorSmsDto,
  ) {
    return this.userService.setupTwoFactorSms(user, body);
  }

  @Put('/two-factor/sms/enable')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async enableTwoFactorSms(
    @AuthUser() user: any,
    @Body() body: EnableTwoFactorSmsDto,
  ) {
    return this.userService.enableTwoFactorSms(user, body);
  }

  @Put('/two-factor/sms/disable')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async disableTwoFactorSms(
    @AuthUser() user: any,
    @Body() body: DisableTwoFactorSmsDto,
  ) {
    return this.userService.disableTwoFactorSms(user, body);
  }

  @Delete('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteUser(@AuthUser() user: any) {
    return this.userService.deleteUser(user);
  }

  @Delete('/:userId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteUserAdmin(@Param('userId') userId: string) {
    return this.userService.deleteUser({ _id: userId });
  }
}
