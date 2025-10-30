import { forwardRef, Module } from '@nestjs/common';
import { FaqController } from './controllers/faq.controller';
import { FaqService } from './services/faq.service';
import { UserModule } from 'src/modules/user/user.module';
import { RoleModule } from 'src/modules/role/role.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleSchema } from 'src/modules/role/schema/role.schema';
import { UserSchema } from 'src/modules/user/schema/user.schema';
import { FaqSchema } from './schema/faq.schema';
import { ServicesModule } from 'src/services/services.module';
import { FaqCategorySchema } from './schema/faq-category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Role', schema: RoleSchema },
      { name: 'Faq', schema: FaqSchema },
      { name: 'FaqCategory', schema: FaqCategorySchema },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => ServicesModule),
    RoleModule,
  ],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqModule, FaqService],
})
export class FaqModule {}
