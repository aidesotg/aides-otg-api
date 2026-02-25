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
import { Wallet } from 'src/modules/wallet/interface/wallet.interface';
import { CreateProfessionalProfileDto } from '../dto/professional-profile.dto';
import { ProfessionalProfile } from '../interface/professional-profile.interface';
import { BankDto } from '../dto/bank.dto';
import { Bank } from '../interface/bank.interface';
import { NotificationSettingsDto } from '../dto/notification.dto';
import { GoogleService } from 'src/services/google.service';
import {
  VerifyTwoFactorDto,
  EnableTwoFactorDto,
  DisableTwoFactorDto,
  VerifyTwoFactorSmsDto,
  EnableTwoFactorSmsDto,
  SetupTwoFactorSmsDto,
  DisableTwoFactorSmsDto,
} from '../dto/two-factor-auth.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { Kyc } from '../interface/kyc.interface';
import { SubmitKycDto } from '../dto/submit-kyc.dto';
import constants from 'src/framework/constants';
import { StripeService } from 'src/services/stripe.service';
import { StripeAccountDto } from 'src/modules/wallet/dto/stripe-account.dto';
import { LocationUpdate, RedisService } from 'src/services/redis.service';
import { ServiceRequest } from 'src/modules/service-request/interface/service-request.interface';
import { ServiceRequestDayLogs } from 'src/modules/service-request/interface/service-request-day-logs.schema';
import { KycAidService } from 'src/services/kycaid.service';
import moment from 'moment';
import { CheckSSNDto } from '../dto/check-ssn.dto';

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
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
    @InjectModel('Bank') private readonly bankModel: Model<Bank>,
    @InjectModel('Kyc') private readonly kycModel: Model<Kyc>,
    @InjectModel('ProfessionalProfile')
    private readonly professionalProfileModel: Model<ProfessionalProfile>,
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
    @InjectModel('ServiceRequestDayLogs')
    private readonly serviceRequestDayLogsModel: Model<ServiceRequestDayLogs>,
    private roleService: RoleService,
    private miscService: MiscCLass,
    private mailerService: Mailer,
    private notificationService: NotificationService,
    private googleService: GoogleService,
    @Inject(forwardRef(() => InsuranceService))
    private insuranceService: InsuranceService,
    private stripeService: StripeService,
    private redisService: RedisService,
    private kycaidService: KycAidService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) { }

  private async generateClientId(user: User): Promise<string> {
    return `Cli${user._id.toString().toUpperCase().slice(-10)}`;
  }

  private async validateUser(user: User, data: UpdateUserDto) {
    const { email, phone } = data;

    if (email) {
      const details = await this.userModel.findOne({ email });
      if (details && details._id.toString() !== user._id.toString()) {
        throw new BadRequestException({
          status: 'error',
          message: 'Email already exists',
        });
      }
    }
    if (phone) {
      const details = await this.userModel.findOne({ phone });
      if (details && details._id.toString() !== user._id.toString()) {
        throw new BadRequestException({
          status: 'error',
          message: 'Phone already exists',
        });
      }
    }
  }

  async checkDuplicateSSN(body: CheckSSNDto) {
    const userSSNExists = await this.userModel.findOne({ ssn: body.ssn });
    if (userSSNExists) {
      throw new BadRequestException({
        status: 'error',
        message: 'SSN already exists for another user',
      });
    }
    const response = await this.kycaidService.verifyEIDV({
      first_name: body.first_name,
      last_name: body.last_name,
      dob: body.dob,
      ssn: body.ssn,
    });

    if (response < 50) {
      throw new BadRequestException({
        status: 'error',
        message: 'SSN is not valid',
        data: { score: response },
      });
    }
    return {
      status: 'success',
      message: 'SSN is available',
      data: { score: response },
    };
  }

  async checkDuplicatePhone(user: User, phone: string) {
    const userExists = await this.userModel.findOne({ phone });
    if (userExists && userExists._id.toString() !== user._id.toString()) {
      throw new BadRequestException({
        status: 'error',
        message: 'Phone number is associated with another user',
      });
    }
    return true;
  }

  async createUser(createUserDto: CreateUserDto) {
    const { first_name, last_name, email, phone, roleId } = createUserDto;
    const role = await this.roleModel.findById(roleId);
    if (!role) {
      throw new NotFoundException({
        status: 'error',
        message: 'Role not found',
      });
    }
    const randomPassword = await this.miscService.generateRandomPassword();
    const user = new this.userModel({
      first_name,
      last_name,
      email,
      phone,
      roles: [role._id],
      password: bcrypt.hashSync(randomPassword, 11),
    });
    await user.save();

    this.mailerService.send(
      new PlainMail(
        email,
        'Account Creation',
        `email: ${email} password: ${randomPassword}`,
        user,
        'An account has just been created for you. please use these credentials to login and validate your account',
      ),
    );

    return {
      status: 'success',
      message: 'User Created',
      data: user,
    };
  }

  async updateUser(userId: string, body: UpdateUserDto) {
    const userDetails = await this.userModel.findById(userId);
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    await this.validateUser(userDetails, body);

    for (const value in body) {
      if (value) {
        userDetails[value] = body[value];
      }
    }
    await userDetails.save();
    return {
      status: 'success',
      message: 'User updated successfully',
      data: userDetails,
    };
  }

  async createProfile(user: User, body: CreateProfileDto) {
    const { beneficiaries, insurance, emergency_contact, address, ...rest } =
      body;
    const session = await this.userModel.db.startSession();
    let userDetails: any;
    await session.startTransaction();
    try {
      userDetails = await this.userModel.findById(user._id).session(session);

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
      userDetails.client_id = await this.generateClientId(userDetails);
      userDetails.address = await this.miscService.formatCoordinates(address);
      if (emergency_contact) {
        userDetails.emergency_contact = [emergency_contact];
      }
      const beneficiariesData: any = [];
      const insuranceData: any = [];
      const userBeneficiaryData: any = [];

      if (beneficiaries && beneficiaries.length > 0) {
        for (const beneficiary of beneficiaries) {
          const { insurance, ...rest } = beneficiary;
          if (beneficiary.insurance) {
            const policyExists =
              await this.insuranceService.verifyExistingInsurance(
                insurance.policy_number,
              );
            if (policyExists) {
              throw new BadRequestException({
                status: 'error',
                message: `Beneficiary with Policy number: ${insurance.policy_number} already exists`,
              });
            }
          }
          const newBeneficiary = new this.beneficiaryModel({
            ...rest,
            user: userDetails._id,
          });
          beneficiariesData.push(newBeneficiary.save({ session }));

          if (beneficiary.insurance) {
            const newInsurance = new this.insuranceModel({
              ...insurance,
              beneficiary: newBeneficiary._id,
            });
            insuranceData.push(newInsurance.save({ session }));
          }

          const newUserBeneficiary = new this.userBeneficiaryModel({
            user: userDetails._id,
            beneficiary: newBeneficiary._id,
          });

          userBeneficiaryData.push(newUserBeneficiary.save({ session }));
        }
      }
      if (insurance) {
        const policyExists =
          await this.insuranceService.verifyExistingInsurance(
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
        insuranceData.push(newInsurance.save({ session }));
      }

      if (beneficiariesData.length > 0) await Promise.all(beneficiariesData);
      if (insuranceData.length > 0) await Promise.all(insuranceData);
      if (userBeneficiaryData.length > 0)
        await Promise.all(userBeneficiaryData);

      await userDetails.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    await this.walletService.createWallet(userDetails, userDetails.email);

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
      .select(constants.userPopulateFields)
      .populate('roles', ['name'])
      .populate('has_applied')
      .populate({
        path: 'beneficiaries',
        populate: [{ path: 'insurance' }],
      })
      .populate({
        path: 'insurance',
      })
      .populate({
        path: 'type_of_care',
        select: '_id title',
      })
      .populate({
        path: 'professional_profile',
        populate: {
          path: 'total_care_given',
        },
      })
      .populate({
        path: 'completed_requests',
        match: { status: 'completed' },
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

  async getUserObject(user: any) {
    const userDetails = await this.getUser(user);
    let wallet = null;
    try {
      wallet = await this.walletService.getUserBalance(user);
    } catch (error) {
      console.log('Error getting user balance:', error);
    }
    return {
      ...userDetails.toJSON(),
      total_care_received: await this.getUserTotalCareReceived(user),
      wallet,
    };
  }

  async getUserTotalCareReceived(user: User) {
    const totalRequestsCreated = await this.serviceRequestModel
      .find({ $or: [{ user: user._id }, { beneficiary: user._id }] })
      .lean()
      .exec();
    const requestIds = await Promise.all(
      totalRequestsCreated.map((request: any) => request._id),
    );
    const totalCareReceived =
      await this.serviceRequestDayLogsModel.countDocuments({
        request: { $in: requestIds },
        status: 'Completed',
      });
    return totalCareReceived;
  }

  async getUsers(params: any) {
    const {
      page = 1,
      pageSize = 50,
      role,
      search,
      startDate,
      endDate,
      ...rest
    } = params;

    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = await this.miscService.search(rest);
    query.isDeleted = false;

    if (role) query.roles = { $in: role };

    // Add date filtering for createdAt field
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set endDate to end of day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Add search functionality for _id, name (first_name/last_name), and email
    if (search) {
      const searchConditions: any[] = [];
      const searchRegex = new RegExp(search, 'i');

      // Search by email
      searchConditions.push({ email: searchRegex });

      // Search by first_name
      searchConditions.push({ first_name: searchRegex });

      // Search by last_name
      searchConditions.push({ last_name: searchRegex });

      // Search by _id if search term is a valid ObjectId
      if (await this.miscService.IsObjectId(search)) {
        searchConditions.push({ _id: search });
      }

      // Combine search conditions with existing query using $or
      if (query.$or) {
        // If query already has $or, combine it with search conditions
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const users = await this.userModel
      .find(query)
      // .select('fullname username phone profile_picture')
      .populate([
        {
          path: 'roles',
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
      .populate({
        path: 'type_of_care',
        select: '_id title',
      })
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

    if (data.ssn && data.ssn !== userDetails.ssn) await this.checkDuplicateSSN({ ssn: data.ssn, first_name: userDetails.first_name, last_name: userDetails.last_name, dob: userDetails.date_of_birth });

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

    await this.notificationService.sendMessage({
      user: userDetails,
      title,
      message,
      resource: 'profile',
      resource_id: userDetails._id.toString(),
    });

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
    await this.walletModel.updateOne(
      { user: userDetails._id },
      { email: body.email },
    );
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

  async addEmergencyContact(body: EmergencyContactDto[], user: User) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    userDetails.emergency_contact.push(...body);
    await userDetails.save();
    return {
      status: 'success',
      message: 'Emergency contact updated successfully',
      data: userDetails,
    };
  }

  async editEmergencyContact(
    id: string,
    body: Partial<EmergencyContactDto>,
    user: User,
  ) {
    const userDetails: any = await this.userModel.findOne({ _id: user._id });
    await Promise.all(
      userDetails.emergency_contact.map(async (contact: any) => {
        if (String(contact._id) === String(id)) {
          for (const value in body) {
            if (value) {
              contact[value] = body[value];
            }
          }
        }
      }),
    );
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

  async suspendUser(user: string, reason?: string) {
    const userDetails = await this.getUser({ _id: user });
    userDetails.status = 'suspended';
    userDetails.suspension_reason = reason ?? '';
    await userDetails.save();

    return {
      status: 'success',
      message: `User suspended successfuly`,
      data: userDetails,
    };
  }

  async unsuspendUser(user: string) {
    const userDetails = await this.getUser({ _id: user });
    userDetails.status = 'active';
    userDetails.suspension_reason = '';
    await userDetails.save();
    return {
      status: 'success',
      message: `User unsuspended successfuly`,
      data: userDetails,
    };
  }

  async updateRole(roleId: string, user: string) {
    const userDetails = await this.userModel.findOne({ _id: user }).exec();

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

    userDetails.roles.push(roleId);

    await userDetails.save();

    const title = 'Update on your account';
    const message = `Your were just assign a new role: ${role.name} by AidesOnTheGo admin`;

    this.mailerService.send(
      new PlainMail(userDetails.email, title, '', userDetails, message),
    );

    await this.notificationService.sendMessage({
      user: userDetails,
      title,
      message,
      resource: 'profile',
      resource_id: userDetails._id.toString(),
    });

    return {
      status: 'success',
      message: `Role update successful`,
    };
  }

  async deleteUser(user: any, body: DeleteAccountDto) {
    const userDetails = await this.getUser({ _id: user._id, isDeleted: false });

    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'User not found',
      });
    }
    const passwordIsValid = await bcrypt.compareSync(
      body.password,
      userDetails.password,
    );
    if (!passwordIsValid) {
      throw new BadRequestException({
        status: 'error',
        message: 'Incorrect Password',
      });
    }

    userDetails.isDeleted = true;
    if (body.reason) userDetails.reason = body.reason;
    if (body.comment) userDetails.comment = body.comment;
    await userDetails.save();

    //TODO handle delete properly

    return {
      status: 'success',
      message: `Acccount deleted successfuly`,
    };
  }

  async deactivateUser(user: User) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'User not found',
      });
    }
    // userDetails.isDeleted = true;
    userDetails.status = 'deactivated';
    await this.logout(userDetails);
    await userDetails.save();
    return {
      status: 'success',
      message: 'Account deactivated successfully',
    };
  }

  async submitKyc(user: User, body: SubmitKycDto) {
    const kyc = new this.kycModel({
      ...body,
      user: user._id,
    });
    await kyc.save();
    return {
      status: 'success',
      message: 'KYC submitted successfully',
      data: kyc,
    };
  }

  async getKycVerifications(user: User) {
    const kyc = await this.kycModel
      .find({ user: user._id })
      .populate('user', ['first_name', 'last_name', 'profile_picture']);

    return {
      status: 'success',
      message: 'KYC verifications fetched successfully',
      data: kyc,
    };
  }

  async editKyc(id: string, body: Partial<SubmitKycDto>, user: User) {
    const kyc = await this.kycModel.findOne({ _id: id, user: user._id });
    if (!kyc) {
      throw new NotFoundException({
        status: 'error',
        message: 'KYC not found',
      });
    }
    for (const value in body) {
      if (value) {
        kyc[value] = body[value];
      }
    }
    kyc.status = 'pending';
    await kyc.save();
    return {
      status: 'success',
      message: 'KYC resubmitted for verification',
      data: kyc,
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
        .countDocuments({ roles: { $in: [role._id] } })
        .exec();
      const roleName = `${role.name}s`;
      // if (role.name !== 'admin') {
      data[roleName] = count;
      // }
    }

    // for (const role of roles) {
    //   if (role.name == 'admin') {
    //     const count = await this.userModel
    //       .countDocuments({ role: role._id })
    //       .exec();
    //     data.admins = count;
    //   } else if (role.name == 'user') {
    //     const count = await this.userModel
    //       .countDocuments({ role: role._id })
    //       .exec();
    //     const roleName = `${role.name}s`;
    //     data[roleName] = count;
    //   }
    // }

    return {
      status: 'success',
      message: `Users by role count feteched successfully`,
      data,
    };
  }

  async addBank(bankDto: BankDto, user: User) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    const bank = new this.bankModel({
      ...bankDto,
      user: userDetails._id,
    });
    await bank.save();
    return {
      status: 'success',
      message: 'Bank added successfully',
      data: bank,
    };
  }

  async getBanks(user: User) {
    const banks = await this.bankModel.find({ user: user._id });
    return {
      status: 'success',
      message: 'Banks fetched successfully',
      data: banks,
    };
  }

  async updateBank(id: string, bankDto: Partial<BankDto>, user: User) {
    const bankDetails = await this.bankModel.findOne({
      user: user._id,
      _id: id,
    });
    if (!bankDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'bank not found',
      });
    }
    if (bankDto.default)
      await this.bankModel.updateMany({ user: user._id }, { default: false });

    for (const value in bankDto) {
      if (value) {
        bankDetails[value] = bankDto[value];
      }
    }
    await bankDetails.save();
    return {
      status: 'success',
      message: 'Bank updated successfully',
      data: bankDetails,
    };
  }

  async deleteBank(id: string, user: User) {
    const bankDetails = await this.bankModel.findOne({
      user: user._id,
      _id: id,
    });
    if (!bankDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'bank not found',
      });
    }
    await bankDetails.deleteOne();
    return {
      status: 'success',
      message: 'Bank deleted successfully',
    };
  }

  async updateNotificationSettings(
    notificationSettingsDto: NotificationSettingsDto,
    user: User,
  ) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    for (const value in notificationSettingsDto) {
      userDetails.notification_settings[value] = notificationSettingsDto[value];
    }
    await userDetails.save();
    return {
      status: 'success',
      message: 'Notification settings updated successfully',
      data: userDetails,
    };
  }

  async logout(user: User, device_token?: string) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    //TODO unregister from firebase
    if (device_token) {
      userDetails.device_token = userDetails.device_token.filter(
        (token) => token !== device_token,
      );
    }
    await userDetails.save();
    return {
      status: 'success',
      message: 'Logout successful',
    };
  }

  /**
   * Generate 2FA setup with QR code
   */
  async generateTwoFactorSecret(user: User) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    if (userDetails.twoFactorEnabled.google_authenticator) {
      throw new BadRequestException({
        status: 'error',
        message: 'Two-factor authentication is already enabled',
      });
    }

    const secret = this.googleService.generateSecret(
      userDetails.email,
      'Aides on The Go',
    );

    // Save the secret temporarily for verification
    userDetails.twoFactorSecret = secret;
    await userDetails.save();

    const qrCode = await this.googleService.generateQRCode(
      userDetails.email,
      secret,
      'Aides on The Go',
    );

    return {
      status: 'success',
      message: 'Two-factor secret generated',
      data: {
        secret,
        qrCode,
      },
    };
  }

  /**
   * Enable 2FA after verification
   */
  async enableGoogleTwoFactor(user: User, body: EnableTwoFactorDto) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    if (userDetails.twoFactorEnabled.google_authenticator) {
      throw new BadRequestException({
        status: 'error',
        message: 'Two-factor authentication is already enabled',
      });
    }

    if (!userDetails.twoFactorSecret) {
      throw new BadRequestException({
        status: 'error',
        message: 'Please generate a secret first',
      });
    }

    const isValid = this.googleService.verifyToken(
      userDetails.twoFactorSecret,
      body.token,
    );

    if (!isValid) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid token',
      });
    }

    userDetails.twoFactorEnabled.google_authenticator = true;
    await userDetails.save();

    return {
      status: 'success',
      message: 'Two-factor authentication enabled successfully',
    };
  }

  /**
   * Disable 2FA
   */
  async disableGoogleTwoFactor(user: User, body: DisableTwoFactorDto) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }

    if (!userDetails.twoFactorEnabled) {
      throw new BadRequestException({
        status: 'error',
        message: 'Two-factor authentication is not enabled',
      });
    }

    const passwordIsValid = bcrypt.compareSync(
      body.password,
      userDetails.password,
    );

    if (!passwordIsValid) {
      throw new HttpException(
        { status: 'error', message: 'Incorrect Password' },
        401,
      );
    }

    userDetails.twoFactorEnabled.google_authenticator = false;
    userDetails.twoFactorSecret = null;
    await userDetails.save();

    return {
      status: 'success',
      message: 'Two-factor authentication disabled successfully',
    };
  }

  /**
   * Verify 2FA token
   */
  async verifyGoogleTwoFactorToken(
    user: User,
    body: VerifyTwoFactorDto,
  ): Promise<boolean> {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails || !userDetails.twoFactorSecret) {
      throw new NotFoundException({
        status: 'error',
        message: 'Two-factor authentication is not set up',
      });
    }

    const isValid = this.googleService.verifyToken(
      userDetails.twoFactorSecret,
      body.token,
    );

    if (!isValid) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid token',
      });
    }

    return true;
  }

  async sendTwoFactorSmsToken(user: User) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
  }

  async verifyTwoFactorSms(user: User, body: VerifyTwoFactorSmsDto) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
  }

  async setupTwoFactorSms(user: User, body: SetupTwoFactorSmsDto) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    if (userDetails.twoFactorEnabled.sms) {
      throw new BadRequestException({
        status: 'error',
        message: 'Two-factor authentication is already enabled',
      });
    }
    const token = this.miscService.generateRandomNumber(6);
    userDetails.twoFactorSmsToken = token;
    await userDetails.save();

    // TODO: Send SMS with token
    return {
      status: 'success',
      message:
        'Enter the token sent to your phone to enable two-factor authentication via sms',
      data: {
        token,
      },
    };
  }

  async enableTwoFactorSms(user: User, body: EnableTwoFactorSmsDto) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    if (userDetails.twoFactorEnabled.sms) {
      throw new BadRequestException({
        status: 'error',
        message: 'Two-factor authentication is already enabled',
      });
    }
    if (!userDetails.twoFactorSmsToken) {
      throw new BadRequestException({
        status: 'error',
        message: 'Please generate a token first',
      });
    }
    if (userDetails.twoFactorSmsToken !== body.token) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid token',
      });
    }
    userDetails.twoFactorEnabled.sms = true;
    userDetails.twoFactorSmsToken = null;
    await userDetails.save();
    return {
      status: 'success',
      message: 'Two-factor authentication via sms enabled successfully',
    };
  }

  async disableTwoFactorSms(user: User, body: DisableTwoFactorSmsDto) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    if (!userDetails.twoFactorEnabled.sms) {
      throw new BadRequestException({
        status: 'error',
        message: 'Two-factor authentication via sms is not enabled',
      });
    }
    if (!userDetails.twoFactorSmsToken) {
      throw new BadRequestException({
        status: 'error',
        message: 'Please generate a token first',
      });
    }
    const passwordIsValid = bcrypt.compareSync(
      body.password,
      userDetails.password,
    );
    if (!passwordIsValid) {
      throw new BadRequestException({
        status: 'error',
        message: 'Incorrect password',
      });
    }
    userDetails.twoFactorEnabled.sms = false;
    userDetails.twoFactorSmsToken = null;
    await userDetails.save();
    return {
      status: 'success',
      message: 'Two-factor authentication via sms disabled successfully',
    };
  }

  async manageStripeAccount(user: User, body: StripeAccountDto) {
    const userDetails = await this.userModel.findOne({ _id: user._id });
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    const url = await this.stripeService.createStripeAccount({
      user: userDetails._id,
      ...body,
    });
    return {
      status: 'success',
      message: 'Stripe account management successful',
      data: { url },
    };
  }

  async getNearbyCaregivers(user: User, params: any) {
    const { latitude, longitude } = params;
    const caregivers = await this.redisService.findNearbyCaregivers(
      latitude,
      longitude,
    );
    const caregiversDetails = await this.userModel.find({
      _id: { $in: caregivers.map((caregiver) => caregiver.userId) },
    });
    const caregiversWithDistance = caregiversDetails.map((caregiver) => ({
      ...caregiver,
      distance: caregivers.find((c) => c.userId === caregiver._id.toString())
        ?.distance,
    }));
    return {
      status: 'success',
      message: 'Nearby caregivers fetched',
      data: caregiversWithDistance,
    };
  }

  async updateCaregiverLocation(user: User, location: LocationUpdate) {
    await this.redisService.updateCaregiverLocation(location);
    return {
      status: 'success',
      message: 'Caregiver location updated successfully',
    };
  }

  async isAdmin(user: User) {
    const userDetails: any = await this.userModel
      .findOne({ _id: user._id })
      .populate('roles');
    if (!userDetails) {
      throw new NotFoundException({
        status: 'error',
        message: 'user not found',
      });
    }
    return userDetails.roles.some((role) => role.name === 'admin');
  }


}
