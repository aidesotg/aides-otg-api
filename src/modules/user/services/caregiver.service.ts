import {
  Injectable,
  NotFoundException,
  HttpException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../interface/user.interface';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import { Role } from 'src/modules/role/interface/role.interface';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { FlutterwaveService } from 'src/services/flutterwave.service';
import { MiscCLass } from 'src/services/misc.service';
import {
  PasswordResetAdmin,
  PasswordResetSelf,
} from '../dto/password-reset.dto';
import { RoleService } from 'src/modules/role/services/role.service';
import { Mailer } from 'src/services/mailer.service';
import PlainMail from 'src/services/mailers/templates/plain-mail';
import AccountCreationMail from 'src/services/mailers/templates/account-registration.mail';
import {
  CreateProfileDto,
  EmergencyContactDto,
  UpdateEmailDto,
  UpdatePhoneDto,
  UpdatePreferenceDto,
  UpdateProfileDto,
} from '../dto/profile.dto';
import { Beneficiary } from '../interface/beneficiary.interface';
import { Insurance } from 'src/modules/insurance/interface/insurance.interface';
import { InsuranceService } from 'src/modules/insurance/services/insurance.service';
import { UserBeneficiary } from '../interface/user-beneficiary.interface';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '../dto/beneficiary.dto';
import { WalletService } from 'src/modules/wallet/services/wallet.service';
import { Wallet } from '../../wallet/interface/wallet.interface';
import {
  CreateProfessionalProfileDto,
  UpdateProfessionalProfileDto,
} from '../dto/professional-profile.dto';
import { ProfessionalProfile } from '../interface/professional-profile.interface';
import { UserService } from './user.service';

@Injectable()
export class CaregiverService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Beneficiary')
    private readonly beneficiaryModel: Model<Beneficiary>,
    @InjectModel('Insurance') private readonly insuranceModel: Model<Insurance>,
    @InjectModel('UserBeneficiary')
    private readonly userBeneficiaryModel: Model<UserBeneficiary>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
    @InjectModel('ProfessionalProfile')
    private readonly professionalProfileModel: Model<ProfessionalProfile>,
    private flutterwaveService: FlutterwaveService,
    private roleService: RoleService,
    private miscService: MiscCLass,
    private mailerService: Mailer,
    private notificationService: NotificationService,
    private userService: UserService,
    @Inject(forwardRef(() => InsuranceService))
    private insuranceService: InsuranceService,

    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  private async generateProfileId(
    professionalProfile: ProfessionalProfile,
  ): Promise<string> {
    return `Pid${professionalProfile._id.toString().toUpperCase().slice(-10)}`;
  }

  //PROFESSIONAL PROFILE
  async createProfessionalProfile(
    createProfessionalProfileDto: CreateProfessionalProfileDto,
    user: User,
  ) {
    const { professional_profile, ...rest } = createProfessionalProfileDto;
    const profile = await this.professionalProfileModel.findOne({
      user: user._id,
    });
    if (profile && profile.status !== 'pending') {
      throw new BadRequestException({
        status: 'error',
        message:
          'You currently have a pending Caregiver Application pending review',
      });
    }
    const professionalProfile = new this.professionalProfileModel({
      ...professional_profile,
      status: 'pending',
      user: user._id,
    });
    professionalProfile.profile_id = await this.generateProfileId(
      professionalProfile,
    );
    await professionalProfile.save();

    await this.userService.updateProfile(rest, user);
    return {
      status: 'success',
      message: 'Application under review',
      data: professionalProfile,
    };
  }

  async updateProfessionalProfile(
    updateProfessionalProfileDto: UpdateProfessionalProfileDto,
    user: User,
  ) {
    const profile = await this.professionalProfileModel.findOne({
      user: user._id,
    });
    if (!profile) {
      throw new NotFoundException({
        status: 'error',
        message: 'Professional profile not found',
      });
    }
    for (const value in updateProfessionalProfileDto) {
      if (value) {
        profile[value] = updateProfessionalProfileDto[value];
      }
    }
    await profile.save();
    return {
      status: 'success',
      message: 'Professional profile updated successfully',
      data: profile,
    };
  }
}
