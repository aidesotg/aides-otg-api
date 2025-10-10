import { Injectable, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRoleDto } from './dto/role.dto';
import { Role } from './interface/role.interface';

@Injectable()
export class RoleService {
  constructor(@InjectModel('Role') private readonly roleModel: Model<Role>) {}

  async createRole(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;

    const newRole = new this.roleModel({ name });

    const result = await newRole.save();
    return {
      status: 'success',
      message: 'Role created',
      data: result,
    };
  }

  async getRole(id: any) {
    const role = await this.roleModel.findOne(id).exec();
    if (!role) {
      throw new HttpException(
        { status: 'error', message: 'Role not found' },
        404,
      );
    }
    return role;
  }

  async getAccountRoles(user?: any) {
    console.log(
      '🚀 ~ file: role.service.ts ~ line 40 ~ RoleService ~ getAccountRoles ~ user',
      user,
    );
    let query: any = {
      name: { $in: ['user', 'counsellor'] },
    };
    if (user && user.role.name == 'admin') {
      query = {};
    }
    const roles = await this.roleModel.find(query).select('id name').exec();
    return roles;
  }

  async getRoles() {
    const roles = await this.roleModel.find().select('id name').exec();
    return roles;
  }
}
