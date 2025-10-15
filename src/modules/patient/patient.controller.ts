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
import { PatientService } from './patient.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';

@ApiTags('patient')
@Controller('patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getPatients(@Query() params: any, @AuthUser() user: any) {
    const patients = await this.patientService.getPatients(params, user);
    return {
      status: 'success',
      message: 'Patients fetched',
      data: patients,
    };
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getPatientById(@Param('id') id: string) {
    const patient = await this.patientService.getPatientById(id);
    return {
      status: 'success',
      message: 'Patient fetched',
      data: { patient },
    };
  }

  @Get('/:id/bookings')
  @UseGuards(AuthGuard('jwt'))
  async getPatientBookings(@Param('id') id: string, @Query() params: any) {
    const bookings = await this.patientService.getPatientBookings(id, params);
    return {
      status: 'success',
      message: 'Patient bookings fetched',
      data: bookings,
    };
  }

  @Get('/:id/transactions')
  @UseGuards(AuthGuard('jwt'))
  async getPatientTransactions(@Param('id') id: string, @Query() params: any) {
    const transactions = await this.patientService.getPatientTransactions(
      id,
      params,
    );
    return {
      status: 'success',
      message: 'Patient transactions fetched',
      data: transactions,
    };
  }

  @Post('/create')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createPatient(@Body() body: CreatePatientDto, @AuthUser() user: any) {
    return this.patientService.createPatient(body, user);
  }

  @Put('/:id/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updatePatient(@Param('id') id: string, @Body() body: UpdatePatientDto) {
    return this.patientService.updatePatient(id, body);
  }

  @Put('/:id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deactivatePatient(@Param('id') id: string) {
    return this.patientService.deactivatePatient(id);
  }

  @Put('/:id/reactivate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async reactivatePatient(@Param('id') id: string) {
    return this.patientService.reactivatePatient(id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deletePatient(@Param('id') id: string) {
    return this.patientService.deletePatient(id);
  }
}
