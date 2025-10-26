import { Module } from '@nestjs/common';
import { RolePermissionsService } from 'src/modules/role-permissions/services/role-permissions.service';
import { RolePermissionsController } from 'src/modules/role-permissions/controllers/role-permissions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RolePermissionSchema } from './schema/role-permissions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'RolePermission', schema: RolePermissionSchema },
    ]),
  ],
  providers: [RolePermissionsService],
  controllers: [RolePermissionsController],
})
export class RolePermissionsModule {}
