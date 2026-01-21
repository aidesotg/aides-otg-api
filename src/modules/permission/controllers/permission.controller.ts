import { Get, Req, Res, Param, HttpException, UseFilters, Put, Body } from '@nestjs/common';
import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from 'src/modules/user/services/user.service';
import { PermissionService } from 'src/modules/permission/services/permission.service';
import { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { AddPermissionDto } from '../dto/add-permission.dto';
import { Permissions } from 'src/framework/decorators/permissions.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { PermissionsGuard } from 'src/framework/guards/permissions.guard';

@ApiTags('permission')
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) { }

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
  @Put('/add')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @UseFilters(ExceptionsLoggerFilter)
  @Permissions('permission:update')
  async update(@Body() body: AddPermissionDto, @AuthUser() user: any) {
    return this.permissionService.addUserPermissions(body);
  }

  @Put('/remove')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @UseFilters(ExceptionsLoggerFilter)
  @Permissions('permission:update')
  async removePermission(
    @Body() body: AddPermissionDto,
    @AuthUser() user: any,
  ) {
    return this.permissionService.removeUserPermissions(body);
  }
}
