import { Module } from '@nestjs/common';
import { PermissionService } from './services/permission.service';
import { PermissionController } from './controllers/permission.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionSchema } from './schema/permission.schema';
import { UserSchema } from '../user/schema/user.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Permission', schema: PermissionSchema },
      { name: 'User', schema: UserSchema },
    ]),
    UserModule,
  ],
  providers: [PermissionService],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule { }
