import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  UseGuards,
  UseFilters,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsuranceCompanyService } from 'src/modules/insurance-company/services/insurance-company.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { CreateInsuranceCompanyDto } from 'src/modules/insurance-company/dto/create-insurance.dto';

@ApiTags('insurance-company')
@Controller('insurance-company')
export class InsuranceCompanyController {
  constructor(
    private readonly insuranceCompanyService: InsuranceCompanyService,
  ) {}

  @Post('')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  @ApiOperation({ summary: 'Create a new insurance company' })
  @ApiResponse({
    status: 201,
    description: 'Insurance company created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createInsuranceCompany(
    @Body() createInsuranceCompanyDto: CreateInsuranceCompanyDto,
  ) {
    return this.insuranceCompanyService.createIncuranceCompany(
      createInsuranceCompanyDto,
    );
  }

  @Get('/list')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all insurance companies with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Insurance companies fetched successfully',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page',
  })
  async getInsuranceCompanies(@Query() params: any) {
    const companies = await this.insuranceCompanyService.getInsurancesCompanies(
      params,
    );
    return {
      status: 'success',
      message: 'Insurance companies fetched',
      data: companies,
    };
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get insurance company by ID' })
  @ApiResponse({
    status: 200,
    description: 'Insurance company fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Insurance company not found' })
  @ApiParam({ name: 'id', description: 'Insurance company ID' })
  async getInsuranceCompanyById(@Param('id') id: string) {
    const company = await this.insuranceCompanyService.getInsuranceCompanyById(
      id,
    );
    return {
      status: 'success',
      message: 'Insurance company fetched',
      data: { company },
    };
  }

  @Put('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  @ApiOperation({ summary: 'Update insurance company' })
  @ApiResponse({
    status: 200,
    description: 'Insurance company updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Insurance company not found' })
  @ApiParam({ name: 'id', description: 'Insurance company ID' })
  async updateInsuranceCompany(
    @Param('id') id: string,
    @Body() updateInsuranceDto: Partial<CreateInsuranceCompanyDto>,
  ) {
    return this.insuranceCompanyService.updateInsuranceCompany(
      id,
      updateInsuranceDto,
    );
  }

  @Put('/:id/toggle-status')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  @ApiOperation({
    summary: 'Toggle insurance company status (activate/deactivate)',
  })
  @ApiResponse({
    status: 200,
    description: 'Insurance company status toggled successfully',
  })
  @ApiResponse({ status: 404, description: 'Insurance company not found' })
  @ApiParam({ name: 'id', description: 'Insurance company ID' })
  async activateInsuranceCompany(@Param('id') id: string) {
    return this.insuranceCompanyService.activateInsuranceCompany(id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  @ApiOperation({ summary: 'Delete insurance company' })
  @ApiResponse({
    status: 200,
    description: 'Insurance company deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Insurance company not found' })
  @ApiParam({ name: 'id', description: 'Insurance company ID' })
  async deleteInsurance(@Param('id') id: string) {
    return this.insuranceCompanyService.deleteInsurance(id);
  }
}
