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
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { CreateUserDto } from './dto/create-user.dto';
import {
  PasswordResetAdmin,
  PasswordResetSelf,
} from './dto/password-reset.dto';
import {
  CreateProfileDto,
  EmergencyContactDto,
  UpdateEmailDto,
  UpdatePhoneDto,
  UpdatePreferenceDto,
  UpdateProfileDto,
} from './dto/profile.dto';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
} from './dto/beneficiary.dto';
import { CreateProfessionalProfileDto } from './dto/professional-profile.dto';

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
  @Post('/create')
  @UseGuards(AuthGuard('jwt'))
  async createUser(@Body() body: CreateUserDto) {
    return this.userService.createUser(body);
  }

  @Post('/beneficiaries')
  @UseGuards(AuthGuard('jwt'))
  async createBeneficiaries(
    @Body() body: CreateBeneficiaryDto[],
    @AuthUser() user: any,
  ) {
    return this.userService.createBeneficiary(body, user);
  }
  @Put('/beneficiaries/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateBeneficiary(
    @Body() body: UpdateBeneficiaryDto,
    @Param('id') id: string,
    @AuthUser() user: any,
  ) {
    return this.userService.updateBeneficiary(id, body, user);
  }

  @Get('/beneficiaries')
  @UseGuards(AuthGuard('jwt'))
  async getBeneficiaries(@AuthUser() user: any) {
    return this.userService.getBeneficariesByUserId(user._id);
  }

  @Get('/beneficiaries/:id')
  @UseGuards(AuthGuard('jwt'))
  async getBeneficiaryById(@Param('id') id: string) {
    return this.userService.getBeneficaryById(id);
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

  @Put('/profile/update/emergency-contact')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateEmergencyContact(
    @Body() body: EmergencyContactDto[],
    @AuthUser() user: any,
  ) {
    return this.userService.updateEmergencyContact(body, user);
  }

  @Put('/profile/update/:userId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateProfileUser(
    @Body() body: UpdateProfileDto,
    @Param('userId') userId: string,
  ) {
    return this.userService.updateProfile(body, { _id: userId });
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

  @Post('/request/caregiver')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createProfessionalProfile(
    @Body() body: CreateProfessionalProfileDto,
    @AuthUser() user: any,
  ) {
    return this.userService.createProfessionalProfile(body, user);
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
  async suspendUser(@Param('user') user: string) {
    return this.userService.suspendUser(user);
  }

  @Delete('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteUser(@AuthUser() user: any) {
    return this.userService.deleteUser(user);
  }

  @Delete('/beneficiaries/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteBeneficiary(@Param('id') id: string, @AuthUser() user: any) {
    return this.userService.deleteBeneficiary(id, user);
  }

  @Delete('/:userId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteUserAdmin(@Param('userId') userId: string) {
    return this.userService.deleteUser({ _id: userId });
  }
}
