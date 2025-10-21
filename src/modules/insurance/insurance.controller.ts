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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { InsuranceInfoDto } from './dto/insurance.dto';

@ApiTags('insurance')
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all insurances with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Insurances fetched successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page',
  })
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
  @ApiOperation({ summary: 'Get insurance by ID' })
  @ApiResponse({ status: 200, description: 'Insurance fetched successfully' })
  @ApiResponse({ status: 404, description: 'Insurance not found' })
  @ApiParam({ name: 'id', description: 'Insurance ID' })
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
  @ApiOperation({ summary: 'Get insurance transactions' })
  @ApiResponse({
    status: 200,
    description: 'Insurance transactions fetched successfully',
  })
  @ApiParam({ name: 'id', description: 'Insurance ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page',
  })
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
  @ApiOperation({ summary: 'Update insurance by ID' })
  @ApiResponse({ status: 200, description: 'Insurance updated successfully' })
  @ApiResponse({ status: 404, description: 'Insurance not found' })
  @ApiParam({ name: 'id', description: 'Insurance ID' })
  async updateInsurance(
    @Param('id') id: string,
    @Body() body: Partial<InsuranceInfoDto>,
  ) {
    return this.insuranceService.updateInsurance(id, body);
  }

  @Put('/user/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  @ApiOperation({ summary: 'Update current user insurance' })
  @ApiResponse({
    status: 200,
    description: 'User insurance updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Insurance not found' })
  async updateUserInsurance(
    @AuthUser() user: any,
    @Body() body: Partial<InsuranceInfoDto>,
  ) {
    return this.insuranceService.updateUserInsurance(user, body);
  }

  @Get('/verify/:policy_number')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Verify if insurance policy number exists' })
  @ApiResponse({ status: 200, description: 'Insurance verification result' })
  @ApiParam({ name: 'policy_number', description: 'Policy number to verify' })
  async verifyExistingInsurance(@Param('policy_number') policy_number: string) {
    const exists = await this.insuranceService.verifyExistingInsurance(
      policy_number,
    );
    return {
      status: 'success',
      message: 'Insurance verification completed',
      data: { exists },
    };
  }

  @Put('/:id/activate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  @ApiOperation({ summary: 'Activate insurance' })
  @ApiResponse({ status: 200, description: 'Insurance activated successfully' })
  @ApiResponse({ status: 404, description: 'Insurance not found' })
  @ApiParam({ name: 'id', description: 'Insurance ID' })
  async activateInsurance(@Param('id') id: string) {
    return this.insuranceService.activateInsurance(id);
  }

  @Put('/:id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  @ApiOperation({ summary: 'Deactivate insurance' })
  @ApiResponse({
    status: 200,
    description: 'Insurance deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Insurance not found' })
  @ApiParam({ name: 'id', description: 'Insurance ID' })
  async deactivateInsurance(@Param('id') id: string) {
    return this.insuranceService.deactivateInsurance(id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  @ApiOperation({ summary: 'Delete insurance (soft delete)' })
  @ApiResponse({ status: 200, description: 'Insurance deleted successfully' })
  @ApiResponse({ status: 404, description: 'Insurance not found' })
  @ApiParam({ name: 'id', description: 'Insurance ID' })
  async deleteInsurance(@Param('id') id: string) {
    return this.insuranceService.deleteInsurance(id);
  }
}
