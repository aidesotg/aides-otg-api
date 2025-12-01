import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { seeder } from 'nestjs-seeder';
import * as dotenv from 'dotenv';
import { RoleSeeder } from './modules/role/seeder/role.seeds';
import { PermissionSeeder } from './modules/permission/seeder/permission.seeder';
import { PermissionSchema } from './modules/permission/schema/permission.schema';
import { RoleSchema } from './modules/role/schema/role.schema';
import { RolePermissionSeeder } from './modules/role-permissions/seeder/role-permission.seeder';
import { RolePermissionSchema } from './modules/role-permissions/schema/role-permissions.schema';
import { UserSchema } from './modules/user/schema/user.schema';
import { SuperAdminSeeder } from './modules/user/seeds/superadmin.seed';
import { PoolWalletSchema } from './modules/wallet/schema/pool-wallet.schema';
import { PoolWalletSeeder } from './modules/wallet/seeds/pool-wallet.seed';

dotenv.config();

seeder({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([
      { name: 'Permission', schema: PermissionSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'RolePermission', schema: RolePermissionSchema },
      { name: 'User', schema: UserSchema },
      { name: 'PoolWallet', schema: PoolWalletSchema },
    ]),
    ConfigModule.forRoot(),
  ],
}).run([
  PermissionSeeder,
  RoleSeeder,
  RolePermissionSeeder,
  SuperAdminSeeder,
  PoolWalletSeeder,
]);
