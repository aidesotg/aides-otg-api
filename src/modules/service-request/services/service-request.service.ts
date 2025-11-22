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
    @InjectModel('UserBeneficiary')
    private readonly userBeneficiaryModel: Model<UserBeneficiary>,
    @InjectModel('Favorite') private readonly favoriteModel: Model<Favorite>,
    private miscService: MiscCLass,
    private notificationService: NotificationService,
    private redisService: RedisService,
    @Inject(forwardRef(() => WalletService))
    private walletService: WalletService,
  ) {}

  private generateBookingId() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `BKNG-${timestamp}-${random}`;
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
      if (new Date(date.date) < new Date()) {
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
    const payload = {
      amount: totals.userCoveredCarePrice,
      payment_method: createServiceDto.payment_method,
      type: 'serviceRequest',
      request: createServiceDto,
      path: createServiceDto.path,
      payments: {
        total: totals.totalPrice,
        user_covered_payments: totals.userCoveredCarePrice,
        inurance_covered_payments: totals.insuranceCoveredCarePrice,
        claimed_insurance_payment: 0,
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
            request: createServiceDto,
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
            request: createServiceDto,
            paymentBreakdown: requestpaymentbreakdown,
            checkoutUrl: response.data,
          },
        };
      }
    }

    if (payment_method === 'wallet') {
      const response = await this.walletService.initiate(payload, user, origin);
      return {
        status: 'success',
        message: 'Request awaiting payment',
        data: {
          request: createServiceDto,
          paymentBreakdown: requestpaymentbreakdown,
          checkoutUrl: response.data.checkoutUrl,
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
      .select('name price');

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

    const totalPrice = requestedCareTypesServices.reduce((acc, service) => {
      return acc + service.price;
    }, 0);

    const userCoveredCareTypesServicesPrice =
      userCoveredCareTypesServices.reduce((acc, service) => {
        return acc + service.price;
      }, 0);

    const insuranceCoveredCareTypesServicesPrice =
      insuranceCoveredCareTypesServices.reduce((acc, service) => {
        return acc + service.price;
      }, 0);

    return {
      insuranceCoveredCareTypes: insuranceCoveredCareTypesServices,
      userCoveredCareTypes: userCoveredCareTypesServices,
      totals: {
        totalPrice,
        userCoveredCarePrice: userCoveredCareTypesServicesPrice,
        insuranceCoveredCarePrice: insuranceCoveredCareTypesServicesPrice,
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
      date.day_of_week = await this.miscService.getDayOfWeek(
        date.date.toString(),
      );
    }
    const data = {
      ...createServiceDto,
      beneficiary: recepient_id,
      recepient_type: recepient_type,
      booking_id: this.generateBookingId(),
      transaction_id: transactionId,
      date_list: dateList,
      created_by: user._id,
      payments,
    };

    const newRequest = new this.serviceRequestModel(data);
    const request = await newRequest.save();

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
      care_giver: user._id,
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
    });

    if (!dayLogs) {
      throw new NotFoundException({
        status: 'error',
        message: 'This request has no scheduled service for this day',
      });
    }
    dayLogs.status_history.push({
      status: await this.miscService.capitalizeEachWord(
        status.replaceAll('_', ' '),
      ),
      created_at: new Date(),
    });
    dayLogs.activity_trail[status.toLowerCase()] = true;
    await dayLogs.save();

    if (status == 'on_my_way' && request.status == 'Accepted') {
      request.status = 'In Progress';
      request.status_history.push({
        status: 'In Progress',
        created_at: new Date(),
      });
      await request.save();
    }

    //send notificartion to client
    let message = `Caregiver is on the way to service location`;

    if (status == 'arrived') {
      message = `Caregiver has arrived at the service location`;
    }
    if (status == 'in_progress') {
      message = `Caregiver is providing service`;
    }
    if (status == 'completed') {
      message = `Care session has ended successfully`;

      // Clean up location data when service is completed
      await this.redisService.removeRequestLocation(id);
    }
    await this.notificationService.sendMessage({
      user: request.created_by,
      title: `Service Update: ${
        (request.care_type as unknown as Service)?.name
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
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });
    const query: any = await this.miscService.search(rest);
    if (user) {
      query.created_by = user._id;
    }

    const requests = await this.serviceRequestModel
      .find(query)
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
      ])
      .populate('created_by', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate('care_giver', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate({
        path: 'care_type',
        select: 'name category price',
        populate: {
          path: 'category',
          select: 'title',
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
      ])
      .populate('created_by', ['first_name', 'last_name', 'profile_picture'])
      .populate('care_giver', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate({
        path: 'care_type',
        select: 'name category price',
        populate: {
          path: 'category',
          select: 'title',
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

    const requests = await this.serviceRequestModel
      .find(query)
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
      ])
      .populate('created_by', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate('care_giver', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate({
        path: 'care_type',
        select: 'name category price',
        populate: {
          path: 'category',
          select: 'title',
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

  async getRequestById(id: string) {
    const request = await this.serviceRequestModel
      .findOne({ _id: id })
      .populate('beneficiary', [
        'first_name',
        'last_name',
        'profile_picture',
        'label',
        'relationship',
      ])
      .populate('created_by', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate('care_giver', [
        'first_name',
        'last_name',
        'profile_picture',
        'phone',
      ])
      .populate({
        path: 'care_type',
        select: 'name category price',
        populate: {
          path: 'category',
          select: 'title',
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
          .lean()
          .exec();

        date.activity_trail = activityTrail?.activity_trail || {};
        date.history = activityTrail?.status_history || [];
        return date;
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
        if (new Date(date.date) < new Date()) {
          throw new BadRequestException({
            status: 'error',
            message: 'Dates in the date list cannot be in the past',
          });
        }
        date.day_of_week = await this.miscService.getDayOfWeek(
          date.date.toString(),
        );
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
        status: 'Pending',
      })
      .populate('created_by')
      .populate('care_type');

    if (!request) {
      throw new NotFoundException({
        status: 'error',
        message: 'Request not found',
      });
    }
    if (
      (!request.care_giver && body.status === 'Rejected') ||
      (request.care_giver &&
        request.care_giver.toString() !== user._id.toString() &&
        body.status === 'Rejected')
    ) {
      throw new BadRequestException({
        status: 'error',
        message: 'You cannot reject this request at this time',
      });
    }

    request.status = status;
    request.status_history.push({
      status: status,
      created_at: new Date(),
    });
    request.care_giver = user._id;
    await request.save();

    const days: any[] = [];
    for (const date of request.date_list) {
      days.push({
        day_id: (date as any)._id,
        request: request._id,
        activity_trail: {
          on_my_way: false,
          arrived: false,
          in_progress: false,
          completed: false,
        },
      });
    }

    await this.serviceRequestDayLogsModel.insertMany(days);
    await this.serviceRequestDayLogsModel.insertMany(days);

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

    const caregiver = await this.userModel.findOne({
      _id: caregiverId,
    });
    if (!caregiver) {
      throw new NotFoundException({
        status: 'error',
        message: 'Caregiver not found',
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

  async getFavorites(user: any) {
    const favorites = await this.favoriteModel
      .find({ user: user._id })
      .populate('request')
      .populate('care_giver', ['first_name', 'last_name', 'profile_picture'])
      .exec();
    return {
      status: 'success',
      message: 'Favorites retrieved successfully',
      data: favorites,
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
}
