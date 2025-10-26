import { Get, Req, Res, Param, HttpException } from '@nestjs/common';
import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from 'src/modules/user/services/user.service';
import { PermissionService } from 'src/modules/permission/services/permission.service';
import { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('permission')
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // @UseGuards(AuthGuard('jwt'))
  @Get('/')
  async getPermissions() {
    const permissions = await this.permissionService.getPermissions();
    return {
      status: 'success',
      message: 'permissions fetched',
      data: permissions,
    };
  }
}
