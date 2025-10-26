import { Get } from '@nestjs/common';
import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleService } from 'src/modules/role/services/role.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Role')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('/list')
  @UseGuards(AuthGuard('jwt'))
  async getRoles() {
    const roles = await this.roleService.getRoles();
    return {
      status: 'success',
      message: 'roles fetched',
      data: roles,
    };
  }
}
