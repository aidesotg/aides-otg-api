import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePermissionDto } from 'src/modules/permission/dto/permission.dto';
import { Permission } from 'src/modules/permission/interface/permission.interface';
import { User } from 'src/modules/user/interface/user.interface';
import { UserService } from 'src/modules/user/services/user.service';
import { AddPermissionDto } from '../dto/add-permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel('Permission')
    private readonly permissionModel: Model<Permission>,
    @InjectModel('User') private readonly userModel: Model<User>,
    private readonly userService: UserService,
  ) { }

  async getPermissions() {
    const permissions = await this.permissionModel
      .find()
      .select('name description module')
      .exec();

    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push({
        name: permission.name,
        description: permission.description,
      });
      return acc;
    }, {} as Record<string, Array<{ name: string; description: string }>>);

    // Convert to array format with module and permissions
    const result = Object.keys(groupedPermissions).map((module) => ({
      module,
      permissions: groupedPermissions[module],
    }));

    return result;
  }

  async addUserPermissions(body: AddPermissionDto) {
    console.log(
      '🚀 ~ file: permission.service.ts:27 ~ PermissionService ~ addUserPermissions ~ body:',
      body,
    );
    const { user, permissions } = body;
    const userDetails = await this.userService.getUser({ _id: user });
    for (const permission of permissions) {
      if (!userDetails.permissions.includes(permission))
        userDetails.permissions.push(permission);
    }

    await userDetails.save();
    return {
      status: 'success',
      message: 'Permission updated successfully',
    };
  }

  async removeUserPermissions(body: AddPermissionDto) {
    console.log(
      '🚀 ~ file: permission.service.ts:27 ~ PermissionService ~ addUserPermissions ~ body:',
      body,
    );
    const { user, permissions } = body;
    await this.userService.getUser({ _id: user });
    await this.userModel.updateOne(
      {
        _id: user,
      },
      { $pull: { permissions: { $in: permissions } } },
    );
    return {
      status: 'success',
      message: 'Permission updated successfully',
      data: await this.userService.getUser({ _id: user }),
    };
  }
}
