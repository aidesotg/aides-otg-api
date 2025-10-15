import {
  Injectable,
  NotFoundException,
  HttpException,
  Inject,
  forwardRef,
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
import { CreateProfileDto } from './dto/profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    private flutterwaveService: FlutterwaveService,
    private roleService: RoleService,
    private miscService: MiscCLass,
    private mailerService: Mailer,
    private notificationService: NotificationService,
  ) {}

  async createUser(body: CreateUserDto) {
    const { fullname, country, username, email, role, password } = body;
    const pass = bcrypt.hashSync(password, 10);

    const data: any = {
      fullname: fullname,
      username,
      email,
      country,
      password: pass,
      role,
    };

    const newUser = new this.userModel(data);

    const user = await newUser.save();

    const credentials = {
      email: user.email,
      password,
    };

    this.mailerService.send(
      new AccountCreationMail(email, 'New Account', user, credentials),
    );

    return {
      status: 'success',
      message: 'User created',
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
      .populate('roles', ['name'])
      .populate('wallet', ['balance', 'ledger_balance', '-user'])
      .populate({
        path: 'profile',
      })
      .populate({
        path: 'service_profile',
        populate: [{ path: 'types' }, { path: 'categories' }],
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
          path: 'roles',
          select: 'name',
        },
        {
          path: 'profile',
        },
        {
          path: 'service_profile',
          populate: [{ path: 'types' }, { path: 'categories' }],
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
        path: 'categories',
        select: 'title cover_image',
      },
      {
        path: 'profile',
      },
      {
        path: 'service_profile',
        populate: [{ path: 'types' }, { path: 'categories' }],
      },
    ];

    const users = await this.userModel
      .find({ roles: { $in: role._id }, isDeleted: false })
      // .populate('wallet', ['balance', 'ledger_balance'])
      .populate(populateFields)
      .skip(pagination.offset)
      .limit(pagination.limit)
      .exec();

    const count = await this.userModel
      .countDocuments({ role: { $in: role._id } })
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

  async updateProfile(updateProfileDto: Partial<CreateProfileDto>, user: any) {
    const data: any = { ...updateProfileDto };

    if (updateProfileDto.phone) {
      data.phone = '+234' + updateProfileDto.phone;
    }

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
}
