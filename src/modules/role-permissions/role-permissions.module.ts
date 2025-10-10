import { Module } from '@nestjs/common';
import { RolePermissionsService } from './role-permissions.service';
import { RolePermissionsController } from './role-permissions.controller';
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
