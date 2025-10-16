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
import { User } from './interface/user.interface';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from 'src/modules/role/interface/role.interface';
import { NotificationService } from 'src/modules/notification/notification.service';
import { FlutterwaveService } from 'src/services/flutterwave.service';
import { MiscCLass } from 'src/services/misc.service';
import {
  PasswordResetAdmin,
  PasswordResetSelf,
} from './dto/password-reset.dto';
import { RoleService } from 'src/modules/role/role.service';
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
} from './dto/profile.dto';
import { Beneficiary } from './interface/beneficiary.interface';
import { Insurance } from '../insurance/interface/insurance.interface';
import { InsuranceService } from '../insurance/insurance.service';
import { UserBeneficiary } from './interface/user-beneficiary.interface';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
} from './dto/beneficiary.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Beneficiary')
    private readonly beneficiaryModel: Model<Beneficiary>,
    @InjectModel('Insurance') private readonly insuranceModel: Model<Insurance>,
    @InjectModel('UserBeneficiary')
    private readonly userBeneficiaryModel: Model<UserBeneficiary>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    private flutterwaveService: FlutterwaveService,
    private roleService: RoleService,
    private miscService: MiscCLass,
    private mailerService: Mailer,
    private notificationService: NotificationService,
    @Inject(forwardRef(() => InsuranceService))
    private insuranceService: InsuranceService,
  ) {}

  async createProfile(user: User, body: CreateProfileDto) {
    const { beneficiaries, insurance, emergency_contact, ...rest } = body;
    const userDetails = await this.userModel.findById(user._id);

    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    for (const value in rest) {
      if (value) {
        userDetails[value] = rest[value];
      }
    }
    if (emergency_contact) {
      userDetails.emergency_contact = [emergency_contact];
    }
    const beneficiariesData: any = [];
    const insuranceData: any = [];
    const userBeneficiaryData: any = [];

    for (const beneficiary of beneficiaries) {
      const { insurance, ...rest } = beneficiary;
      const policyExists = await this.insuranceService.verifyExistingInsurance(
        insurance.policy_number,
      );
      if (policyExists) {
        throw new BadRequestException({
          status: 'error',
          message: `Beneficiary with Policy number: ${insurance.policy_number} already exists`,
        });
      }
      const newBeneficiary = new this.beneficiaryModel({
        ...rest,
        user: userDetails._id,
      });

      const newInsurance = new this.insuranceModel({
        ...insurance,
        beneficiary: newBeneficiary._id,
      });

      const newUserBeneficiary = new this.userBeneficiaryModel({
        user: userDetails._id,
        beneficiary: newBeneficiary._id,
      });

      beneficiariesData.push(newBeneficiary.save());
      insuranceData.push(newInsurance.save());
      userBeneficiaryData.push(newUserBeneficiary.save());
    }

    const policyExists = await this.insuranceService.verifyExistingInsurance(
      insurance.policy_number,
    );
    if (policyExists) {
      throw new BadRequestException({
        status: 'error',
        message: `Insurance with Policy number: ${insurance.policy_number} already exists`,
      });
    }

    const newInsurance = new this.insuranceModel({
      ...insurance,
      user: userDetails._id,
    });

    await Promise.all(beneficiariesData);
    await Promise.all(insuranceData);
    await Promise.all(userBeneficiaryData);

    await userDetails.save();
    await newInsurance.save();

    return {
      status: 'success',
      message: 'Profile created successfully',
      data: { user: userDetails },
    };
  }

  async verifyUser(query: any) {
    const searchQuery = { $or: query };
    const users = await this.userModel
      .find(searchQuery)
      .populate('role', ['name'])
      .exec();

    return users;
  }

  async getUser(user: any) {
    const userDetails: any = await this.userModel
      .findOne({ _id: user._id, isDeleted: false })
      .populate('role', ['name'])
      .populate({
        path: 'beneficiaries',
        populate: [{ path: 'insurance' }],
      })
      .populate({
        path: 'insurance',
      })
      .exec();
    if (!userDetails) {
      throw new HttpException(
        { status: 'error', message: 'User not found' },
        404,
      );
    }

    return userDetails;
  }

  async getUsers(params: any) {
    const { page = 1, pageSize = 50, role, ...rest } = params;

    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = await this.miscService.search(rest);
    query.isDeleted = false;

    if (role) query.roles = { $in: role };

    const users = await this.userModel
      .find(query)
      // .select('fullname username phone profile_picture')
      .populate([
        {
          path: 'role',
          select: 'name',
        },
        {
          path: 'insurance',
        },
        {
          path: 'beneficiaries',
          populate: [{ path: 'insurance' }],
        },
      ])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.userModel.countDocuments(query).exec();

    if (!users) {
      throw new HttpException(
        { status: 'error', message: 'User not found' },
        404,
      );
    }
    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      users,
    };
  }

  async getUsersByAccountRoles(roleName: string, params: any) {
    console.log('params', params);
    const { page = 1, pageSize = 50 } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const role: any = await this.roleModel.findOne({ name: roleName }).exec();
    const populateFields: any = [
      {
        path: 'role',
        select: 'name',
      },
      {
        path: 'insurance',
      },
      {
        path: 'beneficiaries',
        populate: [{ path: 'insurance' }],
      },
    ];

    const users = await this.userModel
      .find({ role: role._id, isDeleted: false })
      // .populate('wallet', ['balance', 'ledger_balance'])
      .populate(populateFields)
      .skip(pagination.offset)
      .limit(pagination.limit)
      .exec();

    const count = await this.userModel
      .countDocuments({ role: role._id })
      .exec();

    if (!users) {
      throw new HttpException(
        { status: 'error', message: `No ${roleName}s found` },
        404,
      );
    }
    return {
      status: 'success',
      message: `${roleName}s fetched`,
      data: {
        pagination: {
          ...(await this.miscService.pageCount({ count, page, pageSize })),
          total: count,
        },
        users,
      },
    };
  }

  async updateProfile(updateProfileDto: Partial<UpdateProfileDto>, user: any) {
    const data: any = { ...updateProfileDto };

    const userDetails = await this.userModel
      .findOne({ _id: user._id, isDeleted: false })
      .exec();

    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    for (const value in data) {
      if (value) {
        userDetails[value] = data[value];
      }
    }

    await userDetails.save();

    const title = 'Update on your account';
    const message = `Your account was recently updated`;
    const details =
      'Ignore this message if this update was made by you, else kindly update your log into your account to revert and choose a more suitable password';

    this.mailerService.send(
      new PlainMail(userDetails.email, title, details, userDetails, message),
    );

    await this.notificationService.sendMessage(userDetails, title, message, '');

    return {
      status: 'success',
      message: `Profile update successful`,
      data: { user: userDetails },
    };
  }

  async updateEmail(body: UpdateEmailDto, user: User) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    userDetails.email = body.email;
    // TODO: Send email verification
    await userDetails.save();
    return {
      status: 'success',
      message: 'Email updated successfully',
      data: userDetails,
    };
  }

  async updatePreference(preference: UpdatePreferenceDto, user: any) {
    const { insurance, ...rest } = preference;
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    for (const value in rest) {
      if (value) {
        userDetails[value] = preference[value];
      }
    }
    await userDetails.save();
    if (insurance) {
      await this.insuranceService.updateUserInsurance(userDetails, insurance);
    }
    return {
      status: 'success',
      message: 'Preference updated successfully',
      data: userDetails,
    };
  }

  async updatePhone(body: UpdatePhoneDto, user: User) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new BadRequestException({
        status: 'error',
        message: 'user not found',
      });
    }
    userDetails.phone = body.phone;
    // TODO: Send phone verification
    await userDetails.save();
    return {
      status: 'success',
      message: 'Phone updated successfully',
      data: userDetails,
    };
  }

  async updateEmergencyContact(body: EmergencyContactDto[], user: User) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    userDetails.emergency_contact.push(...body);
    await userDetails.save();
    return {
      status: 'success',
      message: 'Emergency contact updated successfully',
      data: userDetails,
    };
  }

  async deleteEmergencyContact(id: string, user: User) {
    const userDetails: any = await this.userModel.findOne({ _id: user._id });
    userDetails.emergency_contact = userDetails.emergency_contact.filter(
      (contact) => String(contact._id) !== String(id),
    );
    await userDetails.save();
    return {
      status: 'success',
      message: 'Emergency contact deleted successfully',
      data: userDetails,
    };
  }

  async getUserReferrals(user: any, params?: any) {
    const id = params && params.id ? params.id : user._id;
    const users = await this.userModel
      .find({ referred_by: id })
      .select('name username email avatar')
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.userModel
      .countDocuments({ referred_by: id })
      .exec();

    return {
      status: 'success',
      message: 'referrals fetched',
      data: {
        total: count,
        referrals: users,
      },
    };
  }

  async suspendUser(user: string) {
    const userDetails = await this.getUser({ _id: user });
    const status = userDetails.is_suspended;
    userDetails.is_suspended = !status;
    await userDetails.save();

    let value = 'suspended';
    if (status) {
      value = 'unsuspended';
    }
    return {
      status: 'success',
      message: `User ${value} successfuly`,
    };
  }

  async updateRole(roleId: string, user: string) {
    const userDetails = await this.userModel
      .findOne({ _id: user, isDeleted: false })
      .exec();

    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    const role = await this.roleModel.findOne({ _id: roleId });
    if (!role) {
      throw new NotFoundException({
        status: 'error',
        message: 'role not found',
      });
    }

    userDetails.role = roleId;

    await userDetails.save();

    const title = 'Update on your account';
    const message = `Your were just assign a new role: ${role.name} by AidesOnTheGo admin`;

    this.mailerService.send(
      new PlainMail(userDetails.email, title, '', userDetails, message),
    );

    await this.notificationService.sendMessage(userDetails, title, message, '');

    return {
      status: 'success',
      message: `Role update successful`,
    };
  }

  async deleteUser(user: any) {
    const userDetails = await this.getUser({ _id: user._id, isDeleted: false });

    if (!userDetails) {
      throw new HttpException(
        { status: 'error', message: 'User not found' },
        404,
      );
    }

    userDetails.isDeleted = true;
    await userDetails.save();

    return {
      status: 'success',
      message: `Acccount deleted successfuly`,
    };
  }

  async resetPassword(passwordDto: PasswordResetSelf, user: any) {
    const details = await this.userModel.findById(user._id);
    const passwordIsValid = bcrypt.compareSync(
      passwordDto.old_password,
      details.password,
    );

    if (!passwordIsValid) {
      throw new HttpException(
        { status: 'error', message: 'Incorrect Password' },
        401,
      );
    }

    details.password = bcrypt.hashSync(passwordDto.new_password, 11);
    await details.save();
    return {
      status: 'success',
      message: `Password update successful`,
    };
  }

  async resetPasswordAdmin(passwordDto: PasswordResetAdmin) {
    const { user, password } = passwordDto;
    const details = await this.userModel.findOne({ _id: user });

    if (!details) {
      throw new HttpException(
        { status: 'error', message: 'User not found' },
        404,
      );
    }

    details.password = bcrypt.hashSync(password, 11);
    await details.save();
    return {
      status: 'success',
      message: `Password update successful`,
    };
  }

  async getUserCountByRoles() {
    const data: any = {};
    const roles = await this.roleModel.find();

    data.total = await this.userModel.countDocuments().exec();

    for (const role of roles) {
      const count = await this.userModel
        .countDocuments({ account_roles: { $in: [role._id] } })
        .exec();
      const roleName = `${role.name}s`;
      if (role.name !== 'admin') {
        data[roleName] = count;
      }
    }

    for (const role of roles) {
      if (role.name == 'admin') {
        const count = await this.userModel
          .countDocuments({ role: role._id })
          .exec();
        data.admins = count;
      } else if (role.name == 'user') {
        const count = await this.userModel
          .countDocuments({ role: role._id })
          .exec();
        const roleName = `${role.name}s`;
        data[roleName] = count;
      }
    }

    return {
      status: 'success',
      message: `Users by role count feteched successfully`,
      data,
    };
  }

  //BENEFICIARY
  async createBeneficiary(
    createBeneficiaryDto: CreateBeneficiaryDto[],
    user: User,
  ) {
    const beneficiariesData: any = [];
    const insuranceData: any = [];
    const userBeneficiaryData: any = [];

    for (const beneficiary of createBeneficiaryDto) {
      const { insurance, ...rest } = beneficiary;
      const policyExists = await this.insuranceService.verifyExistingInsurance(
        insurance.policy_number,
      );
      if (policyExists) {
        throw new BadRequestException({
          status: 'error',
          message: `Beneficiary with Policy number: ${insurance.policy_number} already exists`,
        });
      }
      const newBeneficiary = new this.beneficiaryModel({
        ...rest,
        user: user._id,
      });

      const newInsurance = new this.insuranceModel({
        ...insurance,
        beneficiary: newBeneficiary._id,
      });

      const newUserBeneficiary = new this.userBeneficiaryModel({
        user: user._id,
        beneficiary: newBeneficiary._id,
      });

      beneficiariesData.push(newBeneficiary.save());
      insuranceData.push(newInsurance.save());
      userBeneficiaryData.push(newUserBeneficiary.save());
    }

    await Promise.all(beneficiariesData);
    await Promise.all(insuranceData);
    await Promise.all(userBeneficiaryData);

    return {
      status: 'success',
      message: 'Beneficiary created successfully',
    };
  }

  async updateBeneficiary(
    id: string,
    updateBeneficiaryDto: UpdateBeneficiaryDto,
    user: any,
  ) {
    const { insurance, ...rest } = updateBeneficiaryDto;
    const userBeneficiary = await this.userBeneficiaryModel.findOne({
      beneficiary: id,
      user: user._id,
    });
    if (!userBeneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found for user',
      });
    }
    const beneficiary = await this.beneficiaryModel.findOne({
      _id: id,
    });
    if (!beneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found',
      });
    }
    for (const value in rest) {
      if (value) {
        beneficiary[value] = updateBeneficiaryDto[value];
      }
    }
    await beneficiary.save();
    return {
      status: 'success',
      message: 'Beneficiary updated successfully',
      data: beneficiary,
    };
  }

  async getBeneficariesByUserId(userId: string) {
    const beneficiaryIds = await Promise.all(
      (
        await this.userBeneficiaryModel.find({ user: userId })
      ).map(async (beneficiary) => beneficiary.beneficiary),
    );
    const beneficiaries = await this.beneficiaryModel
      .find({
        _id: { $in: beneficiaryIds },
      })
      .populate('insurance');
    return {
      status: 'success',
      message: 'Beneficiaries fetched successfully',
      data: beneficiaries,
    };
  }

  async getBeneficaryById(beneficiaryId: string) {
    const beneficiary = await this.beneficiaryModel
      .findById(beneficiaryId)
      .populate('insurance');
    if (!beneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found',
      });
    }
    return {
      status: 'success',
      message: 'Beneficiary fetched successfully',
      data: beneficiary,
    };
  }

  async getBeneficaryByEmail(email: string) {
    const beneficiary = await this.beneficiaryModel.findOne({
      email: email,
      is_deleted: false,
    });
    return beneficiary;
  }

  async deleteBeneficiary(id: string, user: any) {
    const userBeneficiary = await this.userBeneficiaryModel.findOne({
      beneficiary: id,
      user: user._id,
    });
    if (!userBeneficiary) {
      throw new NotFoundException({
        status: 'error',
        message: 'Beneficiary not found for user',
      });
    }
    await this.userBeneficiaryModel.deleteOne({
      user: user._id,
      beneficiary: id,
    });
    await this.beneficiaryModel.deleteOne({ _id: id });
    await this.insuranceModel.deleteOne({
      beneficiary: id,
      user: { $eq: null },
    });
    return {
      status: 'success',
      message: 'Beneficiary deleted successfully',
    };
  }
}
