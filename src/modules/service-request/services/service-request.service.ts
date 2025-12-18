import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ServiceRequest } from '../interface/service-request.interface';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestDto,
  UpdateLocationDto,
} from 'src/modules/service-request/dto/service-request.dto';
import { MiscCLass } from 'src/services/misc.service';
import { User } from 'src/modules/user/interface/user.interface';
import { UserBeneficiary } from 'src/modules/user/interface/user-beneficiary.interface';
import { Beneficiary } from 'src/modules/user/interface/beneficiary.interface';
import { ServiceRequestDayLogs } from 'src/modules/service-request/interface/service-request-day-logs.schema';
import { Favorite } from 'src/modules/service-request/interface/favorite.interface';
import { AddFavoriteDto } from 'src/modules/service-request/dto/favorite.dto';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { Service } from 'src/modules/service/interface/service.interface';
import { CancelRequestDto } from '../dto/cancel-request.dto';
import { UpdateActivityTrailDto } from '../dto/activity-trail.dto';
import { AcceptRequestDto } from '../dto/accept-request.dto';
import { Review } from '../interface/review.interface';
import { AddReviewDto } from '../dto/add-review.dto';
import { RedisService } from 'src/services/redis.service';
import { InsuranceCompany } from 'src/modules/insurance-company/interface/insurance-comapny.interface';
import { Insurance } from 'src/modules/insurance/interface/insurance.interface';
import { UserService } from 'src/modules/user/services/user.service';
import { WalletService } from 'src/modules/wallet/services/wallet.service';
import { Transaction } from 'src/modules/wallet/interface/transaction.interface';
import moment from 'moment-timezone';
import constants, { DEFAULT_TIMEZONE } from 'src/framework/constants';
import { PoolWalletService } from 'src/modules/wallet/services/pool-wallet.service';

@Injectable()
export class ServiceRequestService {
  constructor(
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
    @InjectModel('Insurance') private readonly insuranceModel: Model<Insurance>,
    @InjectModel('ServiceRequestDayLogs')
    private readonly serviceRequestDayLogsModel: Model<ServiceRequestDayLogs>,
    @InjectModel('Service') private readonly serviceModel: Model<Service>,
    @InjectModel('Review') private readonly reviewModel: Model<Review>,
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Beneficiary')
    private readonly beneficiaryModel: Model<Beneficiary>,
    @InjectModel('UserBeneficiary')
    private readonly userBeneficiaryModel: Model<UserBeneficiary>,
    @InjectModel('Favorite') private readonly favoriteModel: Model<Favorite>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    private miscService: MiscCLass,
    private notificationService: NotificationService,
    private redisService: RedisService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
    @Inject(forwardRef(() => PoolWalletService))
    private poolWalletService: PoolWalletService,
  ) {}

  private generateBookingId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BKNG-${timestamp}-${random}`;
  }

  /**
   * Calculate total hours from all date slots in the date_list
   * @param dateList - Array of date slots with start_time and end_time
   * @returns Total number of hours across all slots
   */
  private calculateTotalHours(
    dateList: Array<{ start_time?: string; end_time?: string }>,
  ): number {
    if (!Array.isArray(dateList) || dateList.length === 0) {
      return 1; // Default to 1 hour if no date list provided
    }

    let totalHours = 0;

    for (const slot of dateList) {
      if (!slot.start_time || !slot.end_time) {
        continue; // Skip slots without both times
      }

      try {
        // Parse time strings (format: "HH:mm" or "HH:mm:ss")
        const startTime = moment(slot.start_time, ['HH:mm', 'HH:mm:ss']);
        const endTime = moment(slot.end_time, ['HH:mm', 'HH:mm:ss']);

        if (!startTime.isValid() || !endTime.isValid()) {
          continue; // Skip invalid times
        }

        // Calculate difference in hours
        const hours = endTime.diff(startTime, 'hours', true);
        if (hours > 0) {
          totalHours += hours;
        }
      } catch (error) {
        // Skip slots with parsing errors
        continue;
      }
    }

    // Return at least 1 hour if calculation resulted in 0
    return totalHours > 0 ? totalHours : 1;
  }

  /**
   * Calculate caregiver payout for a single day based on start_time and end_time
   * @param dateSlot - Single date slot with start_time and end_time
   * @param careTypeIds - Array of care type service IDs
   * @returns Caregiver payout amount for that single day
   */
  private async calculateSingleDayPrice(
    dateSlot: { start_time?: string; end_time?: string },
    careTypeIds: string[],
  ): Promise<{ caregiverPayoutForDay: number; hoursForDay: number }> {
    if (!dateSlot.start_time || !dateSlot.end_time) {
      return { caregiverPayoutForDay: 0, hoursForDay: 0 }; // Return 0 if times are missing
    }

    try {
      // Calculate hours for this single day
      const startTime = moment(dateSlot.start_time, ['HH:mm', 'HH:mm:ss']);
      const endTime = moment(dateSlot.end_time, ['HH:mm', 'HH:mm:ss']);

      if (!startTime.isValid() || !endTime.isValid()) {
        return { caregiverPayoutForDay: 0, hoursForDay: 0 }; // Return 0 for invalid times
      }

      const hoursForDay = endTime.diff(startTime, 'hours', true);
      if (hoursForDay <= 0) {
        return { caregiverPayoutForDay: 0, hoursForDay: 0 };
      }

      // Fetch services with their commission percentages
      const services = await this.serviceModel
        .find({
          _id: { $in: careTypeIds },
          status: 'active',
        })
        .select('price care_giver_commission');

      if (!services || services.length === 0) {
        return { caregiverPayoutForDay: 0, hoursForDay: 0 };
      }

      // Calculate caregiver payout for this day
      // For each service: (price * commission / 100) * hoursForDay
      const caregiverPayoutForDay = services.reduce((acc, service) => {
        const payoutPerHour =
          service.price * ((service.care_giver_commission || 0) / 100);
        return acc + payoutPerHour * hoursForDay;
      }, 0);

      return { caregiverPayoutForDay, hoursForDay };
    } catch (error) {
      console.error('Error calculating single day price:', error);
      return { caregiverPayoutForDay: 0, hoursForDay: 0 };
    }
  }

  private getDayStartDate(dateValue: string | Date): Date {
    const momentObj =
      dateValue instanceof Date
        ? moment(dateValue).tz(DEFAULT_TIMEZONE)
        : moment.tz(
            dateValue,
            ['YYYY-MM-DD', moment.ISO_8601],
            DEFAULT_TIMEZONE,
          );

    if (!momentObj.isValid()) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid date provided',
      });
    }

    return momentObj.startOf('day').toDate();
  }

  private getSlotStartDateTime(slot: {
    date: string | Date;
    start_time?: string;
  }) {
    const baseMoment = moment(this.getDayStartDate(slot.date)).tz(
      DEFAULT_TIMEZONE,
    );
    const timeParts = (slot.start_time ?? '00:00').split(':');
    const [hoursStr, minutesStr = '0', secondsStr = '0'] = timeParts;
    const hours = Number.parseInt(hoursStr ?? '0', 10) || 0;
    const minutes = Number.parseInt(minutesStr ?? '0', 10) || 0;
    const seconds = Number.parseInt(secondsStr ?? '0', 10) || 0;

    baseMoment.set({
      hour: hours,
      minute: minutes,
      second: seconds,
      millisecond: 0,
    });

    if (!baseMoment.isValid()) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid date or time provided',
      });
    }

    return baseMoment.toDate();
  }

  async initiateCreateServiceRequest(
    createServiceDto: CreateServiceRequestDto,
    user: User,
    type: string,
    origin?: string,
  ) {
    if (type !== 'web' && type !== 'mobile') {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid type param, allowed values are: web or mobile',
      });
    }
    const { beneficiary, date_list, ...rest } = createServiceDto;
    let payment_method = createServiceDto.payment_method;

    if (!createServiceDto.self_care) {
      const isBeneficiary = await this.userBeneficiaryModel.findOne({
        beneficiary: beneficiary,
        user: user._id,
      });
      if (!isBeneficiary) {
        throw new NotFoundException({
          status: 'error',
          message: 'Beneficiary not found for user',
        });
      }
    }

    const services = await this.serviceModel.find({
      _id: { $in: createServiceDto.care_type },
    });

    const unsupportedServices = [];
    for (const service of services) {
      if (service.status !== 'active') unsupportedServices.push(service.name);
    }
    if (unsupportedServices.length > 0) {
      throw new BadRequestException({
        status: 'error',
        message: `The following services are currently not supported: ${unsupportedServices.join(
          ', ',
        )}`,
      });
    }

    const dateList = date_list as any;
    for (const date of dateList) {
      const slotDateTime = this.getSlotStartDateTime(date);
      if (slotDateTime < new Date()) {
        throw new BadRequestException({
          status: 'error',
          message: 'Dates in the date list cannot be in the past',
        });
      }
    }

    const requestpaymentbreakdown = await this.calculateTotalPrice(
      createServiceDto,
      user,
    );
    console.log(
      '🚀 ~ ServiceRequestService ~ initiateCreateServiceRequest ~ requestpaymentbreakdown:',
      requestpaymentbreakdown,
    );
    const { totals } = requestpaymentbreakdown;
    const booking_id = this.generateBookingId();
    const beneficiaryDetails = await this.beneficiaryModel
      .findById(createServiceDto.beneficiary)
      .lean()
      .exec();
    const payload = {
      amount: totals.userCoveredCarePrice,
      payment_method: createServiceDto.payment_method,
      type: 'serviceRequest',
      request: {
        ...createServiceDto,
        beneficiary: beneficiaryDetails,
        booking_id: booking_id,
      },
      path: createServiceDto.path,
      payments: {
        total: totals.totalPrice,
        user_covered_payments: totals.userCoveredCarePrice,
        inurance_covered_payments: totals.insuranceCoveredCarePrice,
        claimed_insurance_payment: 0,
        total_service_hours: totals.totalServiceHours,
        fee_per_hour: totals.feePerHour,
        platform_commission: totals.platformCommission,
        caregiver_payout: totals.caregiverPayout,
      },
    };

    if (!payment_method) payment_method = 'stripe';

    if (payment_method === 'stripe') {
      if (type === 'web') {
        const response = await this.walletService.initiate(
          payload,
          user,
          origin,
        );
        //TODO: Send notification to care giver if care giver is passed

        return {
          status: 'success',
          message: 'Request awaiting payment',
          data: {
            request: payload.request,
            paymentBreakdown: requestpaymentbreakdown,
            checkoutUrl: response.data.checkoutUrl,
          },
        };
      }
      if (type === 'mobile') {
        const response = await this.walletService.initiateMobile(payload, user);
        return {
          status: 'success',
          message: 'Request awaiting payment',
          data: {
            request: payload.request,
            paymentBreakdown: requestpaymentbreakdown,
            checkoutUrl: response.data,
          },
        };
      }
    }

    if (payment_method === 'wallet') {
      await this.walletService.canTransact(payload.amount, user._id);
      await this.walletService.debit({
        id: user._id,
        amount: payload.amount,
        description: `Service request payment for ${booking_id}`,
        genus: constants.transactionGenus.PAYMENT,
      });

      const transaction = new this.transactionModel({
        tx_ref: await this.miscService.referenceGenerator(),
        user: user._id,
        email: user.email,
        fullname: `${user.first_name} ${user.last_name}`,
        currency: process.env.CURRENCY ?? 'USD',
        amount: payload.amount,
        status: 'successful',
        type: 'serviceRequest',
        details: JSON.stringify(payload),
        payment_method: 'wallet',
      });
      await transaction.save();
      await this.updateServiceRequestPayment(user, transaction);
      return {
        status: 'success',
        message: 'Payment successful',
        data: {
          request: payload.request,
          paymentBreakdown: requestpaymentbreakdown,
        },
      };
    }

    if (payment_method === 'googlePay') {
      const response = await this.walletService.createMobilePaymentIntent(
        payload,
      );
    }

    if (payment_method === 'applePay') {
      const response = await this.walletService.createMobilePaymentIntent(
        payload,
      );
    }

    throw new BadRequestException({
      status: 'error',
      message: 'Invalid type param, allowed values are: web or mobile',
    });
  }

  // async createServiceRequest(
  //   createServiceDto: CreateServiceRequestDto,
  //   user: User,
  //   origin?: string,
  // ) {
  //   const { beneficiary, date_list, ...rest } = createServiceDto;
  //   let recepient_type = 'User';
  //   let recepient_id = user._id;
  //   if (!createServiceDto.self_care) {
  //     const isBeneficiary = await this.userBeneficiaryModel.findOne({
  //       beneficiary: beneficiary,
  //       user: user._id,
  //     });
  //     if (!isBeneficiary) {
  //       throw new NotFoundException({
  //         status: 'error',
  //         message: 'Beneficiary not found for user',
  //       });
  //     }
  //     recepient_type = 'Beneficiary';
  //     recepient_id = isBeneficiary._id;
  //   }
  //   const dateList = date_list as any;
  //   for (const date of dateList) {
  //     if (new Date(date.date) < new Date()) {
  //       throw new BadRequestException({
  //         status: 'error',
  //         message: 'Dates in the date list cannot be in the past',
  //       });
  //     }
  //     date.day_of_week = await this.miscService.getDayOfWeek(
  //       date.date.toString(),
  //     );
  //   }
  //   const data = {
  //     ...createServiceDto,
  //     beneficiary: recepient_id,
  //     recepient_type: recepient_type,
  //     booking_id: this.generateBookingId(),
  //     date_list: dateList,
  //     created_by: user._id,
  //   };

  //   const newRequest = new this.serviceRequestModel(data);
  //   const request = await newRequest.save();

  //   // const requestpaymentbreakdown = await this.calculateTotalPrice(request);
  //   // const { totals } = requestpaymentbreakdown;

  //   const response = await this.walletService.initiate(
  //     {
  //       amount: totals.userCoveredCarePrice,
  //       payment_method: 'stripe',
  //       type: 'serviceRequest',
  //       requestId: request._id,
  //     },
  //     user,
  //     origin,
  //   );
  //   //TODO: Send notification to care giver if care giver is passed

  //   return {
  //     status: 'success',
  //     message: 'Request created',
  //     data: {
  //       request: await this.getRequestById(request._id),
  //       paymentBreakdown: requestpaymentbreakdown,
  //       checkoutUrl: response.data.checkoutUrl,
  //     },
  //   };
  // }

  async calculateTotalPrice(request: CreateServiceRequestDto, user: User) {
    let insurance;
    if (!request.self_care) {
      insurance = await this.insuranceModel
        .findOne({
          beneficiary: request.beneficiary.toString(),
        })
        .populate('insurance_company');
    } else {
      insurance = await this.insuranceModel
        .findOne({
          user: user._id.toString(),
        })
        .populate('insurance_company');
    }
    // if (!insurance) {
    //   throw new NotFoundException({
    //     status: 'error',
    //     message: 'Insurance not found',
    //   });
    // }
    const InsuranceCompany: InsuranceCompany =
      insurance?.insurance_company as any;

    const insuranceCoveredCareTypes = request.care_type.filter((service) => {
      return InsuranceCompany?.services_covered?.includes(service);
    });

    const userCoveredCareTypes = request.care_type.filter((service) => {
      return !insuranceCoveredCareTypes.includes(service);
    });

    // Fetch all care types services just once
    const requestedCareTypesServices = await this.serviceModel
      .find({
        _id: { $in: request.care_type },
        status: 'active',
      })
      .select('name price care_giver_commission');

    // Filter the fetched services based on coverage types
    const userCoveredCareTypesServices = requestedCareTypesServices.filter(
      (service) => {
        return userCoveredCareTypes.some(
          (careTypeId) => service._id.toString() === careTypeId.toString(),
        );
      },
    );

    const insuranceCoveredCareTypesServices = requestedCareTypesServices.filter(
      (service) => {
        return insuranceCoveredCareTypes.some(
          (careTypeId) => service._id.toString() === careTypeId.toString(),
        );
      },
    );

    // Calculate total hours from all date slots
    const numberOfHours = this.calculateTotalHours(request.date_list);

    const totalPricePerHour = requestedCareTypesServices.reduce(
      (acc, service) => acc + service.price,
      0,
    );
    const totalPrice = totalPricePerHour * numberOfHours;

    const userCoveredCareTypesServicesPrice =
      userCoveredCareTypesServices.reduce((acc, service) => {
        return acc + service.price;
      }, 0) * numberOfHours;

    const insuranceCoveredCareTypesServicesPrice =
      insuranceCoveredCareTypesServices.reduce((acc, service) => {
        return acc + service.price;
      }, 0) * numberOfHours;

    // Calculate caregiver payout based on each service's commission percentage
    const careGiverPayout = requestedCareTypesServices.reduce(
      (acc, service) => {
        // Calculate payout per hour for this service: price * commission percentage
        const payoutPerHour =
          service.price * ((service.care_giver_commission || 0) / 100);
        // Multiply by total hours
        return acc + payoutPerHour * numberOfHours;
      },
      0,
    );

    return {
      insuranceCoveredCareTypes: insuranceCoveredCareTypesServices,
      userCoveredCareTypes: userCoveredCareTypesServices,
      totals: {
        totalPrice,
        userCoveredCarePrice: userCoveredCareTypesServicesPrice,
        insuranceCoveredCarePrice: insuranceCoveredCareTypesServicesPrice,
        totalServiceHours: numberOfHours,
        feePerHour: totalPricePerHour,
        platformCommission: totalPrice - careGiverPayout,
        caregiverPayout: careGiverPayout,
      },
    };
  }

  // async calculateTotalPrice(request: CreateServiceRequestDto) {
  //   let insurance;
  //   if (request.recepient_type === 'Beneficiary') {
  //     insurance = await this.insuranceModel
  //       .findOne({
  //         beneficiary: request.beneficiary.toString(),
  //       })
  //       .populate('insurance_company');
  //   }
  //   // if (!insurance) {
  //   //   throw new NotFoundException({
  //   //     status: 'error',
  //   //     message: 'Insurance not found',
  //   //   });
  //   // }
  //   const InsuranceCompany: InsuranceCompany =
  //     insurance?.insurance_company as any;

  //   const insuranceCoveredCareTypes = request.care_type.filter((service) => {
  //     return InsuranceCompany?.services_covered?.includes(service);
  //   });

  //   const userCoveredCareTypes = request.care_type.filter((service) => {
  //     return !insuranceCoveredCareTypes.includes(service);
  //   });

  //   // Fetch all care types services just once
  //   const requestedCareTypesServices = await this.serviceModel.find({
  //     _id: { $in: request.care_type },
  //     status: 'active',
  //   });

  //   // Filter the fetched services based on coverage types
  //   const userCoveredCareTypesServices = requestedCareTypesServices.filter(
  //     (service) => {
  //       return userCoveredCareTypes.some(
  //         (careTypeId) => service._id.toString() === careTypeId.toString(),
  //       );
  //     },
  //   );

  //   const insuranceCoveredCareTypesServices = requestedCareTypesServices.filter(
  //     (service) => {
  //       return insuranceCoveredCareTypes.some(
  //         (careTypeId) => service._id.toString() === careTypeId.toString(),
  //       );
  //     },
  //   );

  //   const totalPrice = requestedCareTypesServices.reduce((acc, service) => {
  //     return acc + service.price;
  //   }, 0);

  //   const userCoveredCareTypesServicesPrice =
  //     userCoveredCareTypesServices.reduce((acc, service) => {
  //       return acc + service.price;
  //     }, 0);

  //   const insuranceCoveredCareTypesServicesPrice =
  //     insuranceCoveredCareTypesServices.reduce((acc, service) => {
  //       return acc + service.price;
  //     }, 0);

  //   return {
  //     insuranceCoveredCareTypes,
  //     userCoveredCareTypes,
  //     totals: {
  //       totalPrice,
  //       userCoveredCarePrice: userCoveredCareTypesServicesPrice,
  //       insuranceCoveredCarePrice: insuranceCoveredCareTypesServicesPrice,
  //     },
  //   };
  // }

  async updateServiceRequestPayment(user: User, transaction: Transaction) {
    const requestBody = JSON.parse(transaction.details);

    await this.poolWalletService.credit({
      amount: transaction.amount,
      description: `Service request payment for ${requestBody.request.booking_id}`,
      genus: constants.transactionGenus.PAYMENT,
      id: user._id,
    });

    await this.createServiceRequest(
      requestBody.request,
      user,
      requestBody.payments,
      transaction.tx_ref ?? transaction.trx_id,
    );

    return;
  }

  async createServiceRequest(
    createServiceDto: CreateServiceRequestDto,
    user: User,
    payments: any,
    transactionId: string,
  ) {
    const { beneficiary, date_list, ...rest } = createServiceDto;
    let recepient_type = 'User';
    let recepient_id = user._id;
    if (!createServiceDto.self_care) {
      const isBeneficiary = await this.userBeneficiaryModel.findOne({
        beneficiary: beneficiary,
        user: user._id,
      });
      recepient_type = 'Beneficiary';
      recepient_id = isBeneficiary.beneficiary;
    }
    const dateList = date_list as any;
    for (const date of dateList) {
      const normalizedDate = this.getDayStartDate(date.date);
      date.day_of_week = await this.miscService.getDayOfWeek(
        normalizedDate.toISOString(),
      );
      date.date = normalizedDate;
    }
    const data = {
      ...createServiceDto,
      location: await this.miscService.formatCoordinates(
        createServiceDto.location,
      ),
      beneficiary: recepient_id,
      recepient_type: recepient_type,
      booking_id: createServiceDto.booking_id ?? this.generateBookingId(),
      transaction_id: transactionId,
      date_list: dateList,
      created_by: user._id,
      payments,
    };

    const newRequest = new this.serviceRequestModel(data);
    const request = await newRequest.save();
    const days: any[] = [];
    for (const date of request.date_list) {
      const { caregiverPayoutForDay, hoursForDay } =
        await this.calculateSingleDayPrice(date, createServiceDto.care_type);
      days.push({
        day_id: (date as any)._id,
        request: request._id,
        activity_trail: {
          on_my_way: false,
          arrived: false,
          in_progress: false,
          completed: false,
        },
        status: 'Pending',
        payment: {
          fee_per_hour: payments.fee_per_hour,
          total_service_hours: hoursForDay,
          caregiver_payout: caregiverPayoutForDay,
        },
        payment_status: 'pending',
      });
    }

    await this.serviceRequestDayLogsModel.insertMany(days);

    //TODO: Send notification to care giver if care giver is passed

    return request;
  }

  async updateCaregiverLocation(
    userId: string,
    updateLocationDto: UpdateLocationDto,
  ) {
    const { latitude, longitude } = updateLocationDto;

    await this.redisService.updateCaregiverLocation({
      userId,
      latitude,
      longitude,
      timestamp: Date.now(),
    });

    return {
      status: 'success',
      message: 'Location updated successfully',
    };
  }

  async findNearbyCaregivers(
    latitude: number,
    longitude: number,
    radius: number = 10,
  ) {
    const nearbyCaregivers = await this.redisService.findNearbyCaregivers(
      latitude,
      longitude,
      radius,
    );

    return {
      status: 'success',
      message: 'Nearby caregivers retrieved',
      data: nearbyCaregivers,
    };
  }

  async findCaregiversNearRequest(requestId: string, radius: number = 10) {
    const nearbyCaregivers = await this.redisService.findCaregiversNearRequest(
      requestId,
      radius,
    );

    return {
      status: 'success',
      message: 'Nearby caregivers retrieved',
      data: nearbyCaregivers,
    };
  }

  async updateRequestLocation(
    requestId: string,
    updateLocationDto: UpdateLocationDto,
  ) {
    const { latitude, longitude } = updateLocationDto;

    await this.redisService.updateClientLocationForRequest(
      requestId,
      latitude,
      longitude,
    );

    return {
      status: 'success',
      message: 'Request location updated',
    };
  }

  async getCaregiverDistance(requestId: string, caregiverId: string) {
    const distance = await this.redisService.calculateDistanceToRequest(
      caregiverId,
      requestId,
    );

    if (distance === null) {
      throw new NotFoundException({
        status: 'error',
        message: 'Could not calculate distance. Location data missing.',
      });
    }

    return {
      status: 'success',
      message: 'Distance calculated',
      data: {
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        unit: 'km',
      },
    };
  }

  async updateActivityTrail(
    id: string,
    body: UpdateActivityTrailDto,
    user: User,
  ) {
    const { status, day_id } = body;
    const request = await this.serviceRequestModel.findOne({
      _id: id,
      // care_giver: user._id,
    });
    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }

    // Update caregiver location on "on my way" status
    if (status === 'on_my_way') {
      const clientLocation =
        await this.redisService.getClientLocationForRequest(id);
      if (clientLocation) {
        await this.redisService.updateCaregiverLocation({
          userId: user._id.toString(),
          latitude: clientLocation.latitude,
          longitude: clientLocation.longitude,
          timestamp: Date.now(),
        });
      }
    }

    const dayLogs = await this.serviceRequestDayLogsModel.findOne({
      request: request._id,
      day_id: day_id,
      care_giver: user._id,
    });

    if (!dayLogs) {
      throw new NotFoundException({
        status: 'error',
        message: 'This request is not on your schedule for this day',
      });
    }
    dayLogs.status_history.push({
      status: await this.miscService.capitalizeEachWord(
        status.replaceAll('_', ' '),
      ),
      created_at: new Date(),
    });
    dayLogs.activity_trail[status.toLowerCase()] = true;
    // await dayLogs.save();

    if (status == 'on_my_way' && request.status == 'Accepted') {
      request.status = 'In Progress';
      request.status_history.push({
        status: 'On My Way',
        created_at: new Date(),
      });
    }

    //send notificartion to client
    let message = `Caregiver is on the way to service location`;

    if (status == 'arrived') {
      message = `Caregiver has arrived at the service location`;
      request.status_history.push({
        status: 'Arrived',
        created_at: new Date(),
      });
    }
    if (status == 'in_progress') {
      message = `Caregiver is providing service`;
      request.status_history.push({
        status: 'In Progress',
        created_at: new Date(),
      });
    }
    if (status == 'completed') {
      message = `Care session has ended successfully`;
      request.status_history.push({
        status: 'Completed',
        created_at: new Date(),
      });
      // request.status = 'Completed';

      const response = await this.completeServiceRequestDayPayment(id, day_id);
      dayLogs.payment_status = response;
      request.payment_status = 'partially_paid';

      // Clean up location data when service is completed
      await this.redisService.removeRequestLocation(id);
    }
    await dayLogs.save();
    //check if all days are paid
    const pendingPayments = await this.serviceRequestDayLogsModel.find({
      request: request._id,
      payment_status: { $ne: 'paid' },
    });
    if (pendingPayments.length === 0) {
      request.payment_status = 'paid';
    }
    await request.save();

    await this.notificationService.sendMessage({
      user: request.created_by,
      title: `Service Update for day: ${
        (request as any).date_list.find((date) => date.day_id === day_id)
          ?.day_of_week
      }`,
      message,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    return {
      status: 'success',
      message: 'Activity trail updated successfully',
      data: await this.getRequestById(id),
    };
  }

  async getRequests(params: any, user?: User) {
    console.log('🚀 ~ ServiceRequestService ~ getRequests ~ user:', user);
    const {
      page = 1,
      pageSize = 50,
      status,
      care_type,
      startDate,
      endDate,
      search,
      ...rest
    } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    if (user) {
      query.created_by = user._id;
    }

    // Filter by status
    if (status) {
      // Handle special status "Unassigned" which means Pending and no caregiver
      if (status === 'Unassigned') {
        query.status = 'Pending';
        query.care_giver = null;
      } else {
        query.status = await this.miscService.globalSearch(status);
      }
    }

    // Filter by care_type
    if (care_type) {
      // care_type is an array, so use $in to match any of the provided care types
      const careTypeArray = Array.isArray(care_type) ? care_type : [care_type];
      query.care_type = { $in: careTypeArray };
    }

    // Filter by date range (createdAt and date_list)
    if (startDate || endDate) {
      const dateConditions: any[] = [];

      // Filter by createdAt
      const createdAtCondition: any = {};
      if (startDate) {
        createdAtCondition.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set endDate to end of day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        createdAtCondition.$lte = end;
      }
      if (Object.keys(createdAtCondition).length > 0) {
        dateConditions.push({ createdAt: createdAtCondition });
      }

      // Filter by date_list array using $elemMatch
      const dateListMatchCondition: any = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateListMatchCondition.$gte = start;
      }
      if (endDate) {
        // Set endDate to end of day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateListMatchCondition.$lte = end;
      }
      if (Object.keys(dateListMatchCondition).length > 0) {
        dateConditions.push({
          date_list: {
            $elemMatch: {
              date: dateListMatchCondition,
            },
          },
        });
      }

      // Use $or to match either createdAt or date_list dates
      if (dateConditions.length > 0) {
        // Handle existing $or or $and in query
        if (query.$or) {
          // If query already has $or, combine it with date conditions using $and
          if (query.$and) {
            query.$and.push({ $or: dateConditions });
          } else {
            query.$and = [{ $or: query.$or }, { $or: dateConditions }];
            delete query.$or;
          }
        } else if (query.$and) {
          // If query already has $and, add date conditions to it
          query.$and.push({ $or: dateConditions });
        } else {
          query.$or = dateConditions;
        }
      }
    }

    // Global search functionality
    if (search) {
      const searchConditions: any[] = [];
      const searchRegex = new RegExp(search, 'i');

      // Search by booking_id
      searchConditions.push({ booking_id: searchRegex });

      // Search by status
      searchConditions.push({ status: searchRegex });

      // Search by created_by or care_giver if search is a valid ObjectId
      if (await this.miscService.IsObjectId(search)) {
        searchConditions.push({ created_by: search });
        searchConditions.push({ care_giver: search });
        searchConditions.push({ beneficiary: search });
      }

      // Search by user names (caregiver, created_by)
      const userSearchRegex = new RegExp(search, 'i');
      const matchingUsers = await this.userModel
        .find({
          $or: [
            { first_name: userSearchRegex },
            { last_name: userSearchRegex },
          ],
        })
        .select('_id')
        .exec();

      if (matchingUsers.length > 0) {
        const userIds = matchingUsers.map((u) => u._id);
        searchConditions.push({ created_by: { $in: userIds } });
        searchConditions.push({ care_giver: { $in: userIds } });
        // Also search beneficiary if it's a User
        searchConditions.push({
          $and: [{ recepient_type: 'User' }, { beneficiary: { $in: userIds } }],
        });
      }

      // Search by beneficiary names (Beneficiary model)
      const matchingBeneficiaries = await this.beneficiaryModel
        .find({
          $or: [
            { first_name: userSearchRegex },
            { last_name: userSearchRegex },
          ],
        })
        .select('_id')
        .exec();

      if (matchingBeneficiaries.length > 0) {
        const beneficiaryIds = matchingBeneficiaries.map((b) => b._id);
        searchConditions.push({
          $and: [
            { recepient_type: 'Beneficiary' },
            { beneficiary: { $in: beneficiaryIds } },
          ],
        });
      }

      // Combine search conditions with existing query using $or
      if (query.$or) {
        // If query already has $or, combine it with search conditions using $and
        if (query.$and) {
          query.$and.push({ $or: searchConditions });
        } else {
          query.$and = [{ $or: query.$or }, { $or: searchConditions }];
          delete query.$or;
        }
      } else if (query.$and) {
        // If query already has $and (e.g., from date filtering), add search conditions
        query.$and.push({ $or: searchConditions });
      } else {
        query.$or = searchConditions;
      }
    }

    console.log('🚀 ~ ServiceRequestService ~ getRequests ~ query:', query);

    const requests = await this.serviceRequestModel
      .find(query)
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
        'special_requirements',
        'gender',
        'date_of_birth',
      ])
      .populate('created_by', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate({
        path: 'care_giver',
        select: ['first_name', 'last_name', 'profile_picture', 'phone'],
        populate: {
          path: 'favorited',
          match: {
            user: user ? user._id : null,
          },
        },
      })
      .populate({
        path: 'care_type',
        select: 'name category price',
        populate: {
          path: 'category',
          select: 'title',
        },
      })
      .populate({
        path: 'feedback_recorded',
        match: {
          user: user ? user._id : null,
        },
      })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.serviceRequestModel.countDocuments(query).exec();

    return {
      status: 'success',
      message: 'Requests fetched',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: requests,
    };
  }

  async getRequestsPool(params: any, user?: User) {
    console.log('🚀 ~ ServiceRequestService ~ getRequestsPool ~ user:', user);
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const {
      query,
      timeOfDay,
      quickFilters,
      minPrice,
      maxPrice,
      radius,
      autoAdjustRadius,
      sortBy,
    } = await this.miscService.buildServiceRequestPoolQuery(
      { ...rest },
      {
        beneficiaryModel: this.beneficiaryModel,
        userModel: this.userModel,
      },
    );
    console.log('🚀 ~ ServiceRequestService ~ getRequestsPool ~ query:', query);

    if (user) {
      query.user = { $ne: user._id };
    }

    const requests = await this.serviceRequestModel
      .find(query)
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
        'special_requirements',
        'gender',
        'date_of_birth',
      ])
      .populate('created_by', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate({
        path: 'care_giver',
        select: ['first_name', 'last_name', 'profile_picture', 'phone'],
        populate: {
          path: 'favorited',
          match: {
            user: user ? user._id : null,
          },
        },
      })
      .populate({
        path: 'care_type',
        select: 'name category price',
        populate: {
          path: 'category',
          select: 'title',
        },
      })
      .exec();

    const requestIds = await Promise.all(requests.map((r) => r._id));

    const poolQuery: any = {
      // $or: [{ status: 'Pending' }, { status: '' }],
    };
    if (query.status) {
      poolQuery.status = query.status;
    }
    if (requestIds.length > 0) {
      poolQuery.request = { $in: requestIds };
    }

    // Price range filter (offered price per hour)
    if (minPrice || maxPrice) {
      poolQuery['payment.fee_per_hour'] = {};
      if (minPrice) {
        poolQuery['payment.fee_per_hour'].$gte = minPrice;
      }
      if (maxPrice) {
        poolQuery['payment.fee_per_hour'].$lte = maxPrice;
      }
    }
    console.log(
      '🚀 ~ ServiceRequestService ~ getRequestsPool ~ poolQuery:',
      poolQuery,
    );

    let requestPool = await this.serviceRequestDayLogsModel
      .find(poolQuery)
      .populate({
        path: 'request',
        populate: [
          {
            path: 'beneficiary',
            select:
              'first_name last_name profile_picture label relationship special_requirements gender date_of_birth',
          },
          {
            path: 'created_by',
            select: 'first_name last_name profile_picture phone',
          },
          {
            path: 'care_giver',
            select:
              'first_name last_name profile_picture phone professional_profile',
            populate: {
              path: 'professional_profile',
              populate: {
                path: 'toal_care_given',
              },
            },
          },
          {
            path: 'care_type',
            select: 'name category price',
            populate: {
              path: 'category',
              select: 'title',
            },
          },
        ],
      })
      .populate({
        path: 'feedback_recorded',
        match: {
          user: user ? user._id : null,
        },
      })
      .exec();

    // Time of day filter (Morning, Afternoon, Evening, Night)
    if (timeOfDay) {
      requestPool = this.miscService.filterPoolByTimeOfDay(
        requestPool,
        timeOfDay,
      );
    }

    // Quick filters: Today, This week, Urgent
    if (quickFilters) {
      requestPool = this.miscService.filterPoolByQuickFilters(
        requestPool,
        quickFilters,
      );
    }

    // Helper to attach the matched day entry from the request.date_list
    const addDayDetails = (log: any) => {
      const doc = log.toObject();
      const dayDetails =
        doc?.request?.date_list?.find(
          (entry: any) => String(entry._id) === String(doc.day_id),
        ) || null;

      return { ...doc, day_details: dayDetails };
    };

    // Distance filter and nearest sorting (requires caregiver user)
    let poolWithDistance: any[] = requestPool;
    const shouldComputeDistance =
      (radius || sortBy === 'nearest' || quickFilters.has('nearMe')) &&
      !!user &&
      !!user._id;

    if (shouldComputeDistance) {
      const radiusMiles =
        radius || quickFilters.has('nearMe') ? Number(radius || 5) : undefined;
      const radiusKm = radiusMiles ? radiusMiles * 1.60934 : undefined;

      const withDistance = await Promise.all(
        requestPool.map(async (log: any) => {
          const distance = await this.redisService.calculateDistanceToRequest(
            String(user._id),
            String(log.request._id),
          );
          return { log, distance };
        }),
      );

      let filtered = withDistance;

      if (radiusKm) {
        filtered = withDistance.filter(
          (item) =>
            item.distance !== null &&
            item.distance !== undefined &&
            item.distance <= radiusKm,
        );

        // Auto-adjust radius during high demand: expand radius if no results
        if (!filtered.length && autoAdjustRadius && radiusKm < 32.19) {
          const expandedRadiusKm = 32.19; // ~20 miles
          filtered = withDistance.filter(
            (item) =>
              item.distance !== null &&
              item.distance !== undefined &&
              item.distance <= expandedRadiusKm,
          );
        }
      }

      poolWithDistance = filtered.map((item) => ({
        ...addDayDetails(item.log),
        distance: item.distance,
      }));
    } else {
      poolWithDistance = requestPool.map((log: any) => addDayDetails(log));
    }

    // Sorting and pagination (DRY via misc service)
    const { paginatedPool, count } = this.miscService.sortAndPaginatePool(
      poolWithDistance,
      {
        sortBy,
        page,
        pageSize,
      },
    );

    return {
      status: 'success',
      message: 'Requests fetched',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: paginatedPool,
    };
  }

  async getPoolRequestById(id: string) {
    const request = await this.serviceRequestDayLogsModel
      .findOne({ _id: id })
      .populate('request')
      .populate({
        path: 'care_giver',
        select:
          'first_name last_name profile_picture phone professional_profile',
        populate: {
          path: 'professional_profile',
          populate: {
            path: 'toal_care_given',
          },
        },
      })
      .exec();
    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }
    // Helper to attach the matched day entry from the request.date_list

    const doc: any = request.toObject();
    const dayDetails =
      doc?.request?.date_list?.find(
        (entry: any) => String(entry._id) === String(doc.day_id),
      ) || null;

    return { ...doc, day_details: dayDetails };
  }

  async getActiveRequests(params: any, user: User) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    if (user) {
      query.created_by = user._id;
    }

    query['$or'] = [
      { status: 'Pending' },
      { status: 'Accepted' },
      { status: 'In Progress' },
    ];
    delete query.status;

    const requests = await this.serviceRequestModel
      .find(query)
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
        'special_requirements',
        'gender',
        'date_of_birth',
      ])
      .populate('created_by', ['first_name', 'last_name', 'profile_picture'])
      .populate({
        path: 'care_giver',
        select:
          'first_name last_name profile_picture phone professional_profile',
        populate: [
          {
            path: 'professional_profile',
            populate: {
              path: 'toal_care_given',
            },
          },
          {
            path: 'favorited',
            match: {
              user: user ? user._id : null,
            },
          },
        ],
      })
      .populate({
        path: 'care_type',
        select: 'name category price',
        populate: {
          path: 'category',
          select: 'title',
        },
      })
      .populate({
        path: 'feedback_recorded',
        match: {
          user: user ? user._id : null,
        },
      })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.serviceRequestModel.countDocuments(query).exec();

    return {
      status: 'success',
      message: 'Active requests fetched',

      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: requests,
    };
  }

  async getCaregiverSchedule(params: any, user: User) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    if (user) {
      query.care_giver = user._id;
    }

    if (!query.status) {
      query['$or'] = [
        { status: 'Completed' },
        { status: 'Accepted' },
        { status: 'In Progress' },
      ];
      delete query.status;
    }

    // const requests = await this.serviceRequestModel
    //   .find(query)
    //   .populate('beneficiary', [
    //     'first_name',
    //     'last_name',
    //     'profile_picture',
    //     'label',
    //     'relationship',
    //     'special_requirements',
    //     'gender',
    //     'date_of_birth',
    //   ])
    //   .populate('created_by', [
    //     'first_name',
    //     'last_name',
    //     'profile_picture',
    //     'phone',
    //   ])
    //   .populate('care_giver', [
    //     'first_name',
    //     'last_name',
    //     'profile_picture',
    //     'phone',
    //   ])
    //   .populate({
    //     path: 'care_type',
    //     select: 'name category price',
    //     populate: {
    //       path: 'category',
    //       select: 'title',
    //     },
    //   })
    //   .skip(pagination.offset)
    //   .limit(pagination.limit)
    //   .sort({ createdAt: -1 })
    //   .exec();

    const requests = await this.serviceRequestDayLogsModel
      .find(query)
      .populate({
        path: 'request',
        populate: [
          {
            path: 'beneficiary',
            select:
              'first_name last_name profile_picture label relationship special_requirements gender date_of_birth',
          },
          {
            path: 'created_by',
            select: 'first_name last_name profile_picture phone',
          },
          {
            path: 'care_giver',
            select:
              'first_name last_name profile_picture phone professional_profile',
            populate: {
              path: 'professional_profile',
              populate: {
                path: 'toal_care_given',
              },
            },
          },
          {
            path: 'care_type',
            select: 'name category price',
            populate: {
              path: 'category',
              select: 'title',
            },
          },
        ],
      })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.serviceRequestDayLogsModel
      .countDocuments(query)
      .exec();

    // Helper to attach the matched day entry from the request.date_list
    const addDayDetails = (log: any) => {
      const doc = log.toObject();
      const dayDetails =
        doc?.request?.date_list?.find(
          (entry: any) => String(entry._id) === String(doc.day_id),
        ) || null;

      return { ...doc, day_details: dayDetails };
    };

    const formatedRequests = await Promise.all(
      requests.map((request) => addDayDetails(request)),
    );
    return {
      status: 'success',
      message: 'Caregiver schedule fetched',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: formatedRequests,
    };
  }

  async getRequestById(id: string, user?: User) {
    const request = await this.serviceRequestModel
      .findOne({ _id: id })
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
        'special_requirements',
        'gender',
        'date_of_birth',
      ])
      .populate('created_by', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate({
        path: 'care_giver',
        select: ['first_name', 'last_name', 'profile_picture', 'phone'],
        populate: {
          path: 'favorited',
          match: {
            user: user ? user._id : null,
          },
        },
      })
      .populate({
        path: 'care_type',
        select: 'name category price',
        populate: {
          path: 'category',
          select: 'title',
        },
      })
      .populate({
        path: 'feedback_recorded',
        match: {
          user: user ? user._id : null,
        },
      })
      .lean()
      .exec();

    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Service not found',
      });
    }
    // const dateList = request.date_list as any;
    const dayLogs = await Promise.all(
      request.date_list.map(async (date: any) => {
        const activityTrail = await this.serviceRequestDayLogsModel
          .findOne({
            day_id: date._id,
          })
          .populate('care_giver', [
            'first_name',
            'last_name',
            'profile_picture',
            'phone',
          ])
          .lean()
          .exec();

        date.activity_trail = activityTrail?.activity_trail || {};
        date.history = activityTrail?.status_history || [];
        return {
          ...date,
          status: activityTrail.status,
          care_giver: activityTrail.care_giver,
        };
      }),
    );

    return {
      ...request,
      date_list: dayLogs,
    };
  }

  async updateServiceRequest(
    id: string,
    updateServiceRequestDto: UpdateServiceRequestDto,
    user: User,
  ) {
    const { beneficiary, date_list, ...rest } = updateServiceRequestDto;
    const service = await this.serviceRequestModel
      .findOne({ _id: id, created_by: user._id })
      .exec();

    if (!service) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }

    const data: any = { ...rest };

    if (beneficiary) {
      const isBeneficiary = await this.userBeneficiaryModel.findOne({
        beneficiary: beneficiary,
        user: user._id,
      });
      if (!isBeneficiary) {
        throw new NotFoundException({
          status: 'error',
          message: 'Beneficiary not found for user',
        });
      }
      data.beneficiary = beneficiary;
    }
    if (date_list && date_list.length > 0) {
      const dateList = date_list as any;
      for (const date of dateList) {
        const slotDateTime = this.getSlotStartDateTime(date);
        if (slotDateTime < new Date()) {
          throw new BadRequestException({
            status: 'error',
            message: 'Dates in the date list cannot be in the past',
          });
        }
        const normalizedDate = this.getDayStartDate(date.date);
        date.day_of_week = await this.miscService.getDayOfWeek(
          normalizedDate.toISOString(),
        );
        date.date = normalizedDate;
      }
      data.date_list = dateList;
    }

    for (const value in data) {
      if (data[value] !== undefined) {
        service[value] = data[value];
      }
    }

    await service.save();

    return {
      status: 'success',
      message: 'Request updated',
      data: await this.getRequestById(id),
    };
  }

  async deleteServiceRequest(id: string, user: User) {
    const request = await this.serviceRequestModel
      .findOne({ _id: id, created_by: user._id })
      .select('_id')
      .exec();
    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }
    await request.deleteOne();
    await this.serviceRequestDayLogsModel
      .deleteMany({ service: request._id })
      .exec();

    return {
      status: 'success',
      message: 'Request deleted successfully',
    };
  }

  async acceptServiceRequest(id: string, body: AcceptRequestDto, user: User) {
    const { status } = body;
    const request = await this.serviceRequestModel
      .findOne({
        _id: id,
        // care_giver: user._id,
        // status: 'Pending',
      })
      .populate('created_by')
      .populate('care_type');

    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }

    const dayLog = await this.serviceRequestDayLogsModel.findOne({
      request: request._id,
      day_id: body.day_id,
      status: 'Pending',
    });
    if (!dayLog) {
      throw new NotFoundException({
        status: 'error',
        message: 'Day not found',
      });
    }
    if (
      (!dayLog.care_giver && body.status === 'Rejected') ||
      (dayLog.care_giver &&
        dayLog.care_giver.toString() !== user._id.toString() &&
        body.status === 'Rejected')
    ) {
      throw new BadRequestException({
        status: 'error',
        message: 'You cannot reject this request at this time',
      });
    }

    dayLog.status = status;
    dayLog.care_giver = user._id;
    await dayLog.save();

    const pendingDays = await this.serviceRequestDayLogsModel.find({
      request: request._id,
      status: 'Pending',
    });
    if (pendingDays.length === 0 && request.status === 'Pending') {
      request.status = 'Accepted';
      request.status_history.push({
        status: 'Accepted',
        created_at: new Date(),
      });
    }
    await request.save();

    // const days: any[] = [];
    // for (const date of request.date_list) {
    //   days.push({
    //     day_id: (date as any)._id,
    //     request: request._id,
    //     activity_trail: {
    //       on_my_way: false,
    //       arrived: false,
    //       in_progress: false,
    //       completed: false,
    //     },
    //   });
    // }

    // await this.serviceRequestDayLogsModel.insertMany(days);
    // await this.serviceRequestDayLogsModel.insertMany(days);

    //send notification to Caregiver and Client

    await this.notificationService.sendMessage({
      user: request.created_by,
      title: 'Request accepted',
      message: `Your request for the following service: ${
        (request.care_type as unknown as Service)?.name
      } has been ${status.toLowerCase()} by the care giver`,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    await this.notificationService.sendMessage({
      user: user,
      title: `Request ${status.toLowerCase()}`,
      message: `You ${status.toLowerCase()} a request for the following service: ${
        (request.care_type as unknown as Service)?.name
      }`,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    return {
      status: 'success',
      message: `Request ${status.toLowerCase()} successfully`,
      data: await this.getRequestById(id),
    };
  }

  async assignCaregiverToRequest(id: string, caregiverId: string) {
    const request = await this.serviceRequestModel
      .findOne({
        _id: id,
      })
      .populate('created_by');

    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }

    if (String(request.care_giver) === String(caregiverId)) {
      throw new BadRequestException({
        status: 'error',
        message: 'Caregiver already assigned to this request',
      });
    }

    const caregiver = await this.userModel
      .findOne({
        _id: caregiverId,
      })
      .populate('professional_profile');
    if (!caregiver) {
      throw new NotFoundException({
        status: 'error',
        message: 'Caregiver not found',
      });
    }
    if ((caregiver as any).suspended) {
      throw new BadRequestException({
        status: 'error',
        message: 'Caregiver is suspended',
      });
    }

    request.care_giver = caregiver._id;
    request.status = 'Pending';
    request.status_history.push({
      status: 'Pending',
      created_at: new Date(),
    });
    await request.save();

    //send notification to caregiver
    await this.notificationService.sendMessage({
      user: caregiver,
      title: 'Request assigned',
      message: `You have been assigned to the following request: ${request.care_type}, please repond to the request within 24 hours`,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    //send notification to client
    await this.notificationService.sendMessage({
      user: request.created_by,
      title: 'Request assigned',
      message: `Your request for the following service: ${request.care_type} has been assigned to a caregiver`,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    const data = request.toObject();
    delete data.created_by;
    return {
      status: 'success',
      message: 'Caregiver assigned to request successfully',
      data,
    };
  }
  // async updateActivityTrail(
  //   id: string,
  //   body: UpdateActivityTrailDto,
  //   user: User,
  // ) {
  //   const { status, day_id } = body;
  //   const request = await this.serviceRequestModel.findOne({
  //     _id: id,
  //     care_giver: user._id,
  //   });
  //   if (!request) {
  //     throw new NotFoundException({
  //       status: 'error',
  //       message: 'Request not found',
  //     });
  //   }
  //   const dayLogs = await this.serviceRequestDayLogsModel.findOne({
  //     request: request._id,
  //     day_id: day_id,
  //   });

  //   if (!dayLogs) {
  //     throw new NotFoundException({
  //       status: 'error',
  //       message: 'This request has no scheduled service for this day',
  //     });
  //   }
  //   dayLogs.status_history.push({
  //     status: await this.miscService.capitalizeEachWord(
  //       status.replaceAll('_', ' '),
  //     ),
  //     created_at: new Date(),
  //   });
  //   dayLogs.activity_trail[status.toLowerCase()] = true;
  //   await dayLogs.save();

  //   if (status == 'on_my_way' && request.status == 'Accepted') {
  //     request.status = 'In Progress';
  //     request.status_history.push({
  //       status: 'In Progress',
  //       created_at: new Date(),
  //     });
  //     await request.save();
  //   }

  //   //send notificartion to client
  //   let message = `Caregiver is on the way to service location`;

  //   if (status == 'arrived') {
  //     message = `Caregiver has arrived at the service location`;
  //   }
  //   if (status == 'in_progress') {
  //     message = `Caregiver is providing service`;
  //   }
  //   if (status == 'completed') {
  //     message = `Care session has ended successfully`;
  //   }
  //   await this.notificationService.sendMessage({
  //     user: request.created_by,
  //     title: `Service Update: ${
  //       (request.care_type as unknown as Service)?.name
  //     }`,
  //     message,
  //     resource: 'service_request',
  //     resource_id: request._id.toString(),
  //   });

  //   return {
  //     status: 'success',
  //     message: 'Activity trail updated successfully',
  //     data: await this.getRequestById(id),
  //   };
  // }

  async cancelServiceRequest(id: string, body: CancelRequestDto, user: User) {
    const { cancellation_reason, cancellation_note } = body;
    const request = await this.serviceRequestModel
      .findOne({
        _id: id,
        care_giver: user._id,
      })
      .populate('created_by');
    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }
    request.cancellation_reason = cancellation_reason;
    request.cancellation_note = cancellation_note ?? '';
    request.status = 'Cancelled';
    request.status_history.push({
      status: 'Cancelled',
      created_at: new Date(),
    });
    await request.save();

    //send notificartion to client
    await this.notificationService.sendMessage({
      user: request.created_by,
      title: 'Request cancelled',
      message: `Your request for the following service: ${
        (request.care_type as unknown as Service)?.name
      } has been cancelled by the caregiver`,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    //send notificartion to care giver
    await this.notificationService.sendMessage({
      user: user,
      title: 'Request cancelled',
      message: `You cancelled the following service: ${
        (request.care_type as unknown as Service)?.name
      }`,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    return {
      status: 'success',
      message: 'Request cancelled successfully',
      data: request,
    };
  }

  async cancelServiceRequestByClient(
    id: string,
    body: CancelRequestDto,
    user: User,
  ) {
    const { cancellation_reason, cancellation_note } = body;
    const request = await this.serviceRequestModel
      .findOne({
        _id: id,
        created_by: user._id,
      })
      .populate('care_giver');
    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }
    request.cancellation_reason = cancellation_reason;
    request.cancellation_note = cancellation_note ?? '';
    request.status = 'Cancelled';
    request.status_history.push({
      status: 'Cancelled',
      created_at: new Date(),
    });
    await request.save();

    //send notificartion to user
    try {
      await this.notificationService.sendMessage({
        user: user,
        title: 'Request cancelled',
        message: `Your request for the following service: ${
          (request.care_type as unknown as Service)?.name
        } has been cancelled r`,
        resource: 'service_request',
        resource_id: request._id.toString(),
      });

      //send notificartion to care giver
      await this.notificationService.sendMessage({
        user: request.care_giver,
        title: 'Request cancelled',
        message: `The client cancelled the following service: ${
          (request.care_type as unknown as Service)?.name
        }`,
        resource: 'service_request',
        resource_id: request._id.toString(),
      });
    } catch (error) {
      console.log(
        '🚀 ~ ServiceRequestService ~ cancelServiceRequestByClient ~ error:',
        error,
      );
      // console.log(error);
    }

    return {
      status: 'success',
      message: 'Request cancelled successfully',
      data: request,
    };
  }

  async cancelServiceRequestAdmin(
    id: string,
    body: CancelRequestDto,
    user: User,
  ) {
    const { cancellation_reason, cancellation_note } = body;
    const request = await this.serviceRequestModel
      .findOne({
        _id: id,
      })
      .populate('created_by');
    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }
    request.cancellation_reason = cancellation_reason;
    request.cancellation_note = cancellation_note ?? '';
    request.status = 'Cancelled';
    request.care_giver = null;
    request.status_history.push({
      status: 'Cancelled',
      created_at: new Date(),
    });
    await request.save();

    //send notificartion to client
    await this.notificationService.sendMessage({
      user: request.created_by,
      title: 'Request cancelled',
      message: `Your request for the following service: ${
        (request.care_type as unknown as Service)?.name
      } has been cancelled`,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    //send notificartion to care giver
    await this.notificationService.sendMessage({
      user: user,
      title: 'Request cancelled',
      message: `You cancelled the following service: ${
        (request.care_type as unknown as Service)?.name
      }`,
      resource: 'service_request',
      resource_id: request._id.toString(),
    });

    return {
      status: 'success',
      message: 'Request cancelled successfully',
      data: request,
    };
  }

  async completeServiceRequestDayPayment(requestId: string, dayId: string) {
    let status = 'paid';
    try {
      const dayLog = await this.serviceRequestDayLogsModel
        .findOne({
          request: requestId,
          day_id: dayId,
        })
        .populate('request');
      if (!dayLog) {
        throw new NotFoundException({
          status: 'error',
          message: 'Day log not found',
        });
      }
      const careGiver = await this.userModel.findOne({
        _id: dayLog.care_giver,
      });
      if (!careGiver) {
        throw new NotFoundException({
          status: 'error',
          message: 'Care giver not found',
        });
      }
      const wallet = await this.walletService.getBalance(careGiver);
      if (!wallet) {
        throw new NotFoundException({
          status: 'error',
          message: 'Care giver wallet not found',
        });
      }
      await this.walletService.credit({
        id: careGiver._id,
        amount: dayLog.payment.caregiver_payout,
        description: `Service request day payment for ${
          (dayLog.request as any as ServiceRequest).booking_id
        }`,
        genus: constants.transactionGenus.EARNED,
      });
    } catch (error) {
      console.log(
        '🚀 ~ ServiceRequestService ~ completeServiceRequestDayPayment ~ error:',
        error,
      );
      status = 'failed';
    }

    // await this.walletService.debit({
    //   id: careGiver._id,
    //   amount: dayLog.payment.caregiver_payout,
    //   description: `Service request day payment for ${dayLog.day_id}`,
    // });
    // dayLog.payment_status = 'paid';
    // await dayLog.save();
    return status;
  }

  async addFavorite(addFavoriteDto: AddFavoriteDto, user: User) {
    const favorite = new this.favoriteModel({
      request: addFavoriteDto.request,
      care_giver: addFavoriteDto.care_giver,
      user: user._id,
    });
    const newFavorite = await favorite.save();
    return {
      status: 'success',
      message: 'Favorite added successfully',
      data: newFavorite,
    };
  }

  async removeFavorite(id: string, user: any) {
    const favorite = await this.favoriteModel.findOne({
      _id: id,
      user: user._id,
    });
    if (!favorite) {
      throw new NotFoundException({
        status: 'error',
        message: 'Favorite not found',
      });
    }
    await favorite.deleteOne();
    return {
      status: 'success',
      message: 'Favorite removed successfully',
    };
  }

  async getFavorites(user: any, params?: any) {
    const { search, startDate, endDate, rating, sortBy, ...rest } =
      params || {};
    const query: any = { user: user._id };

    // Filter by date range (createdAt)
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set endDate to end of day to include the entire day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Global search functionality
    if (search) {
      const searchConditions: any[] = [];
      const searchRegex = new RegExp(search, 'i');

      // Search by request id or favorite _id if search is a valid ObjectId
      if (await this.miscService.IsObjectId(search)) {
        searchConditions.push({ request: search });
        searchConditions.push({ _id: search });
        searchConditions.push({ care_giver: search });
      }

      // Search by care_giver names (first_name, last_name)
      const userSearchRegex = new RegExp(search, 'i');
      const matchingCaregivers = await this.userModel
        .find({
          $or: [
            { first_name: userSearchRegex },
            { last_name: userSearchRegex },
          ],
        })
        .select('_id')
        .exec();

      if (matchingCaregivers.length > 0) {
        const caregiverIds = matchingCaregivers.map((u) => u._id);
        searchConditions.push({ care_giver: { $in: caregiverIds } });
      }

      // Search by user names (first_name, last_name)
      const matchingUsers = await this.userModel
        .find({
          $or: [
            { first_name: userSearchRegex },
            { last_name: userSearchRegex },
          ],
        })
        .select('_id')
        .exec();

      if (matchingUsers.length > 0) {
        const userIds = matchingUsers.map((u) => u._id);
        searchConditions.push({ user: { $in: userIds } });
      }

      // Search by request booking_id
      const matchingRequests = await this.serviceRequestModel
        .find({ booking_id: searchRegex })
        .select('_id')
        .exec();

      if (matchingRequests.length > 0) {
        const requestIds = matchingRequests.map((r) => r._id);
        searchConditions.push({ request: { $in: requestIds } });
      }

      // Combine search conditions with existing query using $or
      if (searchConditions.length > 0) {
        if (query.$or) {
          // If query already has $or, combine it with search conditions
          if (query.$and) {
            query.$and.push({ $or: searchConditions });
          } else {
            query.$and = [{ $or: query.$or }, { $or: searchConditions }];
            delete query.$or;
          }
        } else if (query.$and) {
          // If query already has $and, add search conditions
          query.$and.push({ $or: searchConditions });
        } else {
          query.$or = searchConditions;
        }
      }
    }

    // Fetch all favorites (we'll sort and filter after getting ratings)
    const favorites = await this.favoriteModel
      .find(query)
      .populate('request')
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .exec();

    // Apply rating filter and sorting using misc service
    const filteredAndSorted = await this.miscService.filterAndSortFavorites(
      favorites,
      this.reviewModel,
      {
        rating,
        sortBy: sortBy || 'mostRecentlyUsed',
      },
    );

    return {
      status: 'success',
      message: 'Favorites retrieved successfully',
      data: filteredAndSorted,
    };
  }

  async getFavoriteById(id: string) {
    const favorite = await this.favoriteModel
      .findOne({ _id: id })
      .populate('request', ['name', 'description', 'image'])
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .exec();
    if (!favorite) {
      throw new NotFoundException({
        status: 'error',
        message: 'Favorite not found',
      });
    }
    return {
      status: 'success',
      message: 'Favorite retrieved successfully',
      data: favorite,
    };
  }

  async addReview(addReviewDto: AddReviewDto, user: User) {
    const request = await this.serviceRequestModel.findOne({
      _id: addReviewDto.request,
      created_by: user._id,
    });
    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message:
          'Ypu cannot post a review for this service. Service not fouond',
      });
    }

    const review = await this.reviewModel.findOneAndUpdate(
      {
        request: addReviewDto.request as any,
        user: user._id as any,
      },
      {
        request: addReviewDto.request as any,
        care_giver: request.care_giver as any,
        user: user._id as any,
        rating: addReviewDto.rating,
        review: addReviewDto.review,
      },
      {
        new: true,
        upsert: true,
      },
    );
    return {
      status: 'success',
      message: 'Review posted successfully',
      data: review,
    };
  }

  async deleteReview(id: string, user: User) {
    const review = await this.reviewModel.findOne({ _id: id, user: user._id });
    if (!review) {
      throw new NotFoundException({
        status: 'error',
        message: 'Review not found',
      });
    }
    await review.deleteOne();
    return {
      status: 'success',
      message: 'Review deleted successfully',
    };
  }

  async getReviews(params: any, user?: User) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);

    const reviews = await this.reviewModel
      .find(query)
      .populate('request')
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .populate('user', ['first_name', 'last_name', 'profile_picture'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 });
    const count = await this.reviewModel.countDocuments(query).exec();

    return {
      status: 'success',
      message: 'Reviews retrieved successfully',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      data: reviews,
    };
  }

  async getReviewById(id: string) {
    const review = await this.reviewModel
      .findOne({ _id: id })
      .populate('request')
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .populate('user', ['first_name', 'last_name', 'profile_picture']);
    if (!review) {
      throw new NotFoundException({
        status: 'error',
        message: 'Review not found',
      });
    }
    return {
      status: 'success',
      message: 'Review retrieved successfully',
      data: review,
    };
  }

  async getServiceRequestCounts() {
    const [all, pending, inProgress, unassigned, completed, cancelled, urgent] =
      await Promise.all([
        this.serviceRequestModel.countDocuments().exec(),
        this.serviceRequestModel.countDocuments({ status: 'Pending' }).exec(),
        this.serviceRequestModel
          .countDocuments({ status: 'In Progress' })
          .exec(),
        this.serviceRequestModel
          .countDocuments({ status: 'Pending', care_giver: null })
          .exec(),
        this.serviceRequestModel.countDocuments({ status: 'Completed' }).exec(),
        this.serviceRequestModel.countDocuments({ status: 'Cancelled' }).exec(),
        this.serviceRequestModel.countDocuments({ status: 'Urgent' }).exec(),
      ]);

    return {
      status: 'success',
      message: 'Service request counts fetched successfully',
      data: {
        all,
        pending,
        inProgress,
        unassigned,
        completed,
        cancelled,
        urgent,
      },
    };
  }
}
