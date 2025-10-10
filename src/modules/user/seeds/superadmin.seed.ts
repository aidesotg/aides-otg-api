import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seeder } from 'nestjs-seeder';
import * as bcrypt from 'bcryptjs';
import { User } from '../interface/user.interface';
import { Role } from 'src/modules/role/interface/role.interface';
import Admin from './admin.json';
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
      .find({
        $or: [{ name: 'admin' }, { name: 'customer' }, { name: 'vendor' }],
      })
      .exec();
    if (roles.length) {
      for (const role of roles) adminRoles.push(role._id);
      await this.userModel.updateOne(
        { email: admin.email },
        {
          fullname: admin.fullname,
          username: admin.username,
          email: admin.email,
          password: await bcrypt.hash(admin.password, 11),
          country: admin.country,
          isActive: true,
          roles: adminRoles,
        },
        {
          upsert: true,
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
