import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePermissionDto } from 'src/modules/permission/dto/permission.dto';
import { Permission } from 'src/modules/permission/interface/permission.interface';

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel('Permission')
    private readonly permissionModel: Model<Permission>,
  ) {}

  async getPermissions() {
    const permissions = await this.permissionModel
      .find()
      .select('name description module')
      .exec();

    return permissions;
  }
}
