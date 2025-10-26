import { Injectable, NotFoundException, HttpException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient } from 'src/modules/patient/interface/patient.interface';
import {
  CreatePatientDto,
  UpdatePatientDto,
} from 'src/modules/patient/dto/patient.dto';
import { MiscCLass } from 'src/services/misc.service';
import { InsuranceService } from 'src/modules/insurance/services/insurance.service';

@Injectable()
export class PatientService {
  constructor(
    @InjectModel('Patient') private readonly patientModel: Model<Patient>,
    private miscService: MiscCLass,
    private insuranceService: InsuranceService,
  ) {}

  async createPatient(createPatientDto: CreatePatientDto, user: any) {
    const data = {
      ...createPatientDto,
      created_by: user._id,
      insurance_details: {
        coverage_percentage: 100,
        is_verified: false,
        total_hours_available: 0,
        hours_used: 0,
        ...createPatientDto.insurance_details,
      },
    };

    // If insurance is provided, verify it
    if (createPatientDto.insurance) {
      const insurance = await this.insuranceService.getInsuranceById(
        createPatientDto.insurance,
      );
      if (insurance.integration_type === 'api') {
        // Auto-verify if API integration
        data.insurance_details.is_verified = true;
        // data.insurance_details.verification_date = new Date();
      }
    }

    const newPatient = new this.patientModel(data);
    const patient = await newPatient.save();

    return {
      status: 'success',
      message: 'Patient profile created',
      data: { patient },
    };
  }

  async getPatients(params: any, user: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    query.is_deleted = false;

    // If user is not admin, only show their patients
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      query.created_by = user._id;
    }

    const patients = await this.patientModel
      .find(query)
      .populate('created_by', ['fullname', 'email'])
      .populate('insurance', ['name', 'contact_email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.patientModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      patients,
    };
  }

  async getPatientById(id: string) {
    const patient = await this.patientModel
      .findOne({ _id: id, is_deleted: false })
      .populate('created_by', ['fullname', 'email'])
      .populate('insurance', ['name', 'contact_email', 'covered_services'])
      .populate('bookings')
      .populate('appointments')
      .populate('transactions')
      .exec();

    if (!patient) {
      throw new NotFoundException({
        status: 'error',
        message: 'Patient not found',
      });
    }

    return patient;
  }

  async getPatientBookings(id: string, params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    // This would need to be implemented when Booking module is created
    // For now, return empty result
    return {
      pagination: {
        ...(await this.miscService.pageCount({ count: 0, page, pageSize })),
        total: 0,
      },
      bookings: [],
    };
  }

  async getPatientTransactions(id: string, params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    // This would need to be implemented when Transaction module is created
    // For now, return empty result
    return {
      pagination: {
        ...(await this.miscService.pageCount({ count: 0, page, pageSize })),
        total: 0,
      },
      transactions: [],
    };
  }

  async updatePatient(id: string, updatePatientDto: UpdatePatientDto) {
    const patient = await this.patientModel
      .findOne({ _id: id, is_deleted: false })
      .exec();

    if (!patient) {
      throw new NotFoundException({
        status: 'error',
        message: 'Patient not found',
      });
    }

    const data: any = { ...updatePatientDto };

    // If insurance is being updated, verify it
    if (
      updatePatientDto.insurance &&
      updatePatientDto.insurance !== patient.insurance?.toString()
    ) {
      const insurance = await this.insuranceService.getInsuranceById(
        updatePatientDto.insurance,
      );
      if (insurance.integration_type === 'api') {
        data.insurance_details = {
          ...patient.insurance_details,
          ...updatePatientDto.insurance_details,
          is_verified: true,
          verification_date: new Date(),
        };
      }
    }

    for (const value in data) {
      if (data[value] !== undefined) {
        patient[value] = data[value];
      }
    }

    await patient.save();

    return {
      status: 'success',
      message: 'Patient profile updated',
      data: { patient },
    };
  }

  async deactivatePatient(id: string) {
    const patient = await this.getPatientById(id);
    patient.is_active = false;
    await patient.save();

    return {
      status: 'success',
      message: 'Patient profile deactivated successfully',
    };
  }

  async reactivatePatient(id: string) {
    const patient = await this.getPatientById(id);
    patient.is_active = true;
    await patient.save();

    return {
      status: 'success',
      message: 'Patient profile reactivated successfully',
    };
  }

  async deletePatient(id: string) {
    const patient = await this.getPatientById(id);
    patient.is_deleted = true;
    await patient.save();

    return {
      status: 'success',
      message: 'Patient profile deleted successfully',
    };
  }
}
