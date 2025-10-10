import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seeder } from 'nestjs-seeder';
import { Role } from '../interface/role.interface';
import Roles from './roles.json';

export class RoleSeeder implements Seeder {
  private roles;
  constructor(
    @InjectModel('Role')
    private roleModel: Model<Role>,
  ) {}
  async seed(): Promise<any> {
    this.roles = Roles;
    for (const role of this.roles) {
      await this.roleModel.updateOne(
        { name: role.name },
        {
          name: role.name,
        },
        {
          setDefaultsOnInsert: true,
          upsert: true,
        },
      );
    }
  }

  async drop(): Promise<any> {
    return this.roleModel.deleteMany({});
  }
}
