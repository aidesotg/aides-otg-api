import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseFilters,
  Query,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsuranceService } from './insurance.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { InsuranceInfoDto } from './dto/insurance.dto';

@ApiTags('insurance')
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getInsurances(@Query() params: any) {
    const insurances = await this.insuranceService.getInsurances(params);
    return {
      status: 'success',
      message: 'Insurances fetched',
      data: insurances,
    };
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getInsuranceById(@Param('id') id: string) {
    const insurance = await this.insuranceService.getInsuranceById(id);
    return {
      status: 'success',
      message: 'Insurance fetched',
      data: { insurance },
    };
  }

  @Get('/:id/transactions')
  @UseGuards(AuthGuard('jwt'))
  async getInsuranceTransactions(
    @Param('id') id: string,
    @Query() params: any,
  ) {
    const transactions = await this.insuranceService.getInsuranceTransactions(
      id,
      params,
    );
    return {
      status: 'success',
      message: 'Insurance transactions fetched',
      data: transactions,
    };
  }

  @Put('/:id/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateInsurance(
    @Param('id') id: string,
    @Body() body: Partial<InsuranceInfoDto>,
  ) {
    return this.insuranceService.updateInsurance(id, body);
  }

  @Put('/:id/activate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async activateInsurance(@Param('id') id: string) {
    return this.insuranceService.activateInsurance(id);
  }

  @Put('/:id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deactivateInsurance(@Param('id') id: string) {
    return this.insuranceService.deactivateInsurance(id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteInsurance(@Param('id') id: string) {
    return this.insuranceService.deleteInsurance(id);
  }
}
