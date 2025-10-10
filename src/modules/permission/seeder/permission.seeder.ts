import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seeder } from 'nestjs-seeder';
import { Permission } from '../interface/permission.interface';
import Permissions from './permissions.json';

export class PermissionSeeder implements Seeder {
  private permissions;
  constructor(
    @InjectModel('Permission')
    private permissionModel: Model<Permission>,
  ) {}
  async seed(): Promise<any> {
    this.permissions = Permissions;
    for (var permission of this.permissions) {
      await this.permissionModel.updateOne(
        { name: permission.name },
        {
          name: permission.name,
          description: permission.description,
          module: permission.module,
        },
        {
          setDefaultsOnInsert: true,
          upsert: true,
        },
      );
    }
  }

  async drop(): Promise<any> {
    return this.permissionModel.deleteMany({});
  }
}
