import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seeder } from 'nestjs-seeder';
import { Permission } from 'src/modules/permission/interface/permission.interface';
import { Role } from 'src/modules/role/interface/role.interface';
import { RolePermission } from '../interface/role-permissions.interface';

export class RolePermissionSeeder implements Seeder {
  constructor(
    @InjectModel('Role') private roleRepository: Model<Role>,
    @InjectModel('Permission')
    private permissionRepository: Model<Permission>,
    @InjectModel('RolePermission')
    private roleAndPermissionRepository: Model<RolePermission>,
  ) {}
  async seed(): Promise<any> {
    const permissions = await this.permissionRepository.find();

    const role = await this.roleRepository.findOne({
      name: 'super-admin',
    });
    if (role) {
      for (const permission of permissions) {
        await this.roleAndPermissionRepository.updateOne(
          {
            role: role.id,
            permission: permission.id,
          },
          {
            role: role.id,
            permission: permission.id,
            permission_name: permission.name,
          },
          { upsert: true, setDefaultsOnInsert: true },
        );
      }
    }
  }

  async drop(): Promise<any> {
    return this.roleAndPermissionRepository.deleteMany({});
  }
}
