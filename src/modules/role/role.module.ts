import { Module } from '@nestjs/common';
import { RoleService } from 'src/modules/role/services/role.service';
import { RoleController } from './controllers/role.controller';
import { RoleSchema } from './schema/role.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Role', schema: RoleSchema }])],
  providers: [RoleService],
  controllers: [RoleController],
  exports: [RoleService, RoleModule],
})
export class RoleModule {}
