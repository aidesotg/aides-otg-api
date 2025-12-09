import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seeder } from 'nestjs-seeder';
import * as bcrypt from 'bcryptjs';
import { User } from '../interface/user.interface';
import { Role } from 'src/modules/role/interface/role.interface';
import Admin from './admin.json';
import constants from 'src/framework/constants';
@Injectable()
export class SuperAdminSeeder implements Seeder {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Role') private roleModel: Model<Role>,
    private configService: ConfigService,
  ) {}
  async seed(): Promise<any> {
    //get the user email from the env and password
    // create the user
    const admin = Admin;
    const adminRoles = [];
    const roles = await this.roleModel
      .findOne({ name: constants.roles.SUPER_ADMIN })
      .exec();
    if (roles) {
      await this.userModel.findOneAndUpdate(
        { email: admin.email },
        {
          first_name: admin.first_name,
          last_name: admin.last_name,
          phone: admin.phone,
          email: admin.email,
          password: await bcrypt.hash(admin.password, 11),
          roles: [roles._id],
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );
    }
  }

  async drop(): Promise<any> {
    this.userModel.deleteOne({
      email: Admin.email,
    });
  }
}
