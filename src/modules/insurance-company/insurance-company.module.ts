import { Module } from '@nestjs/common';
import { InsuranceCompanyService } from './services/insurance-company.service';
import { InsuranceCompanyController } from './controllers/insurance-company.controller';
import { InsuranceCompanySchema } from './schema/insurance-company.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'InsuranceCompany', schema: InsuranceCompanySchema },
    ]),
    ServicesModule,
  ],
  providers: [InsuranceCompanyService],
  controllers: [InsuranceCompanyController],
  exports: [InsuranceCompanyService],
})
export class InsuranceCompanyModule {}
