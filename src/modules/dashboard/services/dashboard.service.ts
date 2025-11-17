import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../user/interface/user.interface';
import { ServiceRequest } from '../../service-request/interface/service-request.interface';
import { Role } from '../../role/interface/role.interface';
import { WalletTransaction } from '../../wallet/interface/wallet-transaction.interface';
import { Wallet } from '../../wallet/interface/wallet.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('ServiceRequest')
    private readonly serviceRequestModel: Model<ServiceRequest>,
    @InjectModel('Role') private readonly roleModel: Model<Role>,
    @InjectModel('WalletTransaction')
    private readonly walletTransactionModel: Model<WalletTransaction>,
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
  ) {}

  /**
   * Get summary statistics for the dashboard
   * Returns: Total Users, Active Requests, Total Revenue, Active Caregivers
   */
  async getSummaryStatistics() {
    // Total Users (excluding deleted)
    const totalUsers = await this.userModel
      .countDocuments({ isDeleted: false })
      .exec();

    // Calculate user growth percentage (comparing last 30 days to previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const usersLast30Days = await this.userModel
      .countDocuments({
        isDeleted: false,
        createdAt: { $gte: thirtyDaysAgo },
      })
      .exec();

    const usersPrevious30Days = await this.userModel
      .countDocuments({
        isDeleted: false,
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      })
      .exec();

    const userGrowthPercentage =
      usersPrevious30Days > 0
        ? ((usersLast30Days - usersPrevious30Days) / usersPrevious30Days) * 100
        : 0;

    // Active Requests (Pending, Accepted, In Progress)
    const activeRequests = await this.serviceRequestModel
      .countDocuments({
        status: { $in: ['Pending', 'Accepted', 'In Progress'] },
      })
      .exec();

    // Total Revenue (sum of all payment transactions)
    const revenueResult = await this.walletTransactionModel
      .aggregate([
        {
          $match: {
            genus: 'PAYMENT',
            type: 'credit',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    const totalRevenue = revenueResult[0]?.total || 0;

    // Active Caregivers (users with Care Giver role and active status)
    const caregiverRole = await this.roleModel
      .findOne({ name: 'Care Giver' })
      .exec();

    const activeCaregivers = caregiverRole
      ? await this.userModel
          .countDocuments({
            roles: { $in: [caregiverRole._id] },
            status: 'active',
            isDeleted: false,
          })
          .exec()
      : 0;

    return {
      status: 'success',
      message: 'Summary statistics fetched successfully',
      data: {
        totalUsers: {
          value: totalUsers,
          trend:
            userGrowthPercentage > 0
              ? `+${userGrowthPercentage.toFixed(1)}%`
              : `${userGrowthPercentage.toFixed(1)}%`,
        },
        activeRequests: {
          value: activeRequests,
        },
        totalRevenue: {
          value: totalRevenue,
        },
        activeCaregivers: {
          value: activeCaregivers,
        },
      },
    };
  }

  /**
   * Get financial summary metrics
   */
  async getFinancialSummary() {
    const [walletStats, financialAggregates] = await Promise.all([
      this.walletModel.aggregate([
        {
          $group: {
            _id: null,
            totalBalance: { $sum: { $ifNull: ['$balance', 0] } },
          },
        },
      ]),
      this.serviceRequestModel.aggregate([
        {
          $group: {
            _id: null,
            pendingPayouts: {
              $sum: {
                $cond: [
                  { $eq: ['$status', 'Pending'] },
                  { $ifNull: ['$payments.total', 0] },
                  0,
                ],
              },
            },
            insuranceCoveredPayments: {
              $sum: { $ifNull: ['$payments.inurance_covered_payments', 0] },
            },
            claimedInsurancePayments: {
              $sum: { $ifNull: ['$payments.claimed_insurance_payment', 0] },
            },
            refundsProcessed: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['Cancelled', 'Rejected']] },
                  { $ifNull: ['$payments.total', 0] },
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const totalWalletBalance = walletStats[0]?.totalBalance || 0;
    const aggregates = financialAggregates[0] || {};

    const insuranceCoveredPayments = aggregates.insuranceCoveredPayments || 0;
    const claimedInsurancePayments = aggregates.claimedInsurancePayments || 0;
    const unclaimedInsurancePayments = Math.max(
      insuranceCoveredPayments - claimedInsurancePayments,
      0,
    );

    return {
      status: 'success',
      message: 'Financial summary fetched successfully',
      data: {
        totalWalletBalance,
        pendingPayouts: aggregates.pendingPayouts || 0,
        insuranceCoveredPayments,
        claimedInsurancePayments,
        unclaimedInsurancePayments,
        refundsProcessed: aggregates.refundsProcessed || 0,
      },
    };
  }

  /**
   * Get payment distribution between wallet and insurance
   */
  async getPaymentDistribution() {
    const [distribution] = await this.serviceRequestModel.aggregate([
      {
        $group: {
          _id: null,
          walletPayments: {
            $sum: { $ifNull: ['$payments.user_covered_payments', 0] },
          },
          insurancePayments: {
            $sum: { $ifNull: ['$payments.inurance_covered_payments', 0] },
          },
        },
      },
    ]);

    const walletPayments = distribution?.walletPayments || 0;
    const insurancePayments = distribution?.insurancePayments || 0;
    const total = walletPayments + insurancePayments;

    const walletPercentage = total ? (walletPayments / total) * 100 : 0;
    const insurancePercentage = total ? (insurancePayments / total) * 100 : 0;

    return {
      status: 'success',
      message: 'Payment distribution fetched successfully',
      data: {
        total,
        breakdown: [
          {
            label: 'Wallet',
            value: walletPayments,
            percentage: Number(walletPercentage.toFixed(2)),
          },
          {
            label: 'Insurance',
            value: insurancePayments,
            percentage: Number(insurancePercentage.toFixed(2)),
          },
        ],
      },
    };
  }

  /**
   * Get user growth trend data
   * @param timeframe - 'daily', 'weekly', or 'monthly'
   */
  async getUserGrowthTrend(
    timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly',
  ) {
    const caregiverRole = await this.roleModel
      .findOne({ name: 'Care Giver' })
      .exec();
    const customerRole = await this.roleModel
      .findOne({ name: 'Customer' })
      .exec();

    if (!caregiverRole || !customerRole) {
      throw new Error('Required roles not found');
    }

    let startDate: Date;
    let groupFormat: any;
    const now = new Date();

    if (timeframe === 'weekly') {
      // Get data for the last 7 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);

      // Group by actual date (YYYY-MM-DD) to get each day separately
      groupFormat = {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
      };
    } else if (timeframe === 'daily') {
      // Get data for the last 30 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);

      groupFormat = {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
      };
    } else {
      // Monthly - get data for the last 12 months
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      groupFormat = {
        $dateToString: { format: '%Y-%m', date: '$createdAt' },
      };
    }

    // Get clients (customers) data
    const clientsData = await this.userModel.aggregate([
      {
        $match: {
          roles: { $in: [customerRole._id] },
          isDeleted: false,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get caregivers data
    const caregiversData = await this.userModel.aggregate([
      {
        $match: {
          roles: { $in: [caregiverRole._id] },
          isDeleted: false,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupFormat,
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Format data for response
    const labels: string[] = [];
    const clients: number[] = [];
    const caregivers: number[] = [];

    if (timeframe === 'weekly') {
      // Get the last 7 days and format them
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const last7Days: string[] = [];
      const last7DaysMap = new Map<string, string>(); // date -> day name

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        // JavaScript getDay(): 0=Sunday, 1=Monday, ..., 6=Saturday
        // We want: Monday=0, Tuesday=1, ..., Sunday=6
        const jsDay = date.getDay();
        const dayIndex = jsDay === 0 ? 6 : jsDay - 1;
        const dayName = daysOfWeek[dayIndex];
        last7Days.push(dateStr);
        last7DaysMap.set(dateStr, dayName);
      }

      const clientsMap = new Map(
        clientsData.map((item) => [item._id, item.count]),
      );
      const caregiversMap = new Map(
        caregiversData.map((item) => [item._id, item.count]),
      );

      last7Days.forEach((dateStr) => {
        const dayName = last7DaysMap.get(dateStr) || '';
        labels.push(dayName);
        clients.push(clientsMap.get(dateStr) || 0);
        caregivers.push(caregiversMap.get(dateStr) || 0);
      });
    } else {
      // For daily and monthly, use the actual dates from data
      const allLabels = new Set([
        ...clientsData.map((item) => item._id),
        ...caregiversData.map((item) => item._id),
      ]);
      const sortedLabels = Array.from(allLabels).sort();

      sortedLabels.forEach((label) => {
        labels.push(label);
        const clientData = clientsData.find((item) => item._id === label);
        const caregiverData = caregiversData.find((item) => item._id === label);
        clients.push(clientData?.count || 0);
        caregivers.push(caregiverData?.count || 0);
      });
    }

    return {
      status: 'success',
      message: 'User growth trend fetched successfully',
      data: {
        timeframe,
        labels,
        series: [
          {
            name: 'Clients',
            data: clients,
          },
          {
            name: 'Caregivers',
            data: caregivers,
          },
        ],
      },
    };
  }

  /**
   * Get unassigned service requests
   * @param params - Query parameters (page, pageSize, etc.)
   */
  async getUnassignedRequests(params: any = {}) {
    const { page = 1, pageSize = 50 } = params;

    const skip = (page - 1) * pageSize;
    const limit = parseInt(pageSize.toString(), 10);

    // Find unassigned requests (status is Pending and no care_giver assigned)
    const query = {
      status: 'Pending',
      care_giver: null,
    };

    const unassignedRequests = await this.serviceRequestModel
      .find(query)
      .populate('created_by', ['first_name', 'last_name', 'email'])
      .populate('beneficiary', ['first_name', 'last_name', 'beneficiary_id'])
      .populate('care_type', ['name'])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.serviceRequestModel.countDocuments(query).exec();

    // Format the response to match the dashboard UI
    const formattedRequests = unassignedRequests.map((request: any) => {
      // Calculate time waiting
      const createdAt = new Date(request.createdAt);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      let timeWaiting = '';
      if (diffHours > 0) {
        timeWaiting = `${diffHours}h ${diffMinutes}m`;
      } else {
        timeWaiting = `${diffMinutes}m`;
      }

      // Format request date
      const requestDate = createdAt.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      // Get service type name
      const serviceType =
        request.care_type && request.care_type.length > 0
          ? request.care_type.map((service: any) => service.name).join(', ')
          : 'N/A';

      // Get client/beneficiary names
      let clientBeneficiary = '';
      if (request.beneficiary) {
        clientBeneficiary = `${request.beneficiary.first_name} ${request.beneficiary.last_name}`;
      } else if (request.created_by) {
        clientBeneficiary = `${request.created_by.first_name} ${request.created_by.last_name}`;
      }

      return {
        requestId: request.booking_id || request._id.toString(),
        serviceType,
        clientBeneficiary,
        requestDate,
        timeWaiting,
        status: 'Unassigned',
        _id: request._id.toString(),
      };
    });

    return {
      status: 'success',
      message: 'Unassigned requests fetched successfully',
      data: {
        requests: formattedRequests,
        pagination: {
          page: parseInt(page.toString(), 10),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get service requests snapshot (donut chart data)
   * Returns total count and distribution by status
   */
  async getServiceRequestsSnapshot() {
    // Get total count
    const total = await this.serviceRequestModel.countDocuments().exec();

    // Get distribution by status
    const statusDistribution = await this.serviceRequestModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get unassigned requests (Pending status with no care_giver)
    const unassignedCount = await this.serviceRequestModel
      .countDocuments({
        status: 'Pending',
        care_giver: null,
      })
      .exec();

    // Map statuses to the format expected by the frontend
    const statusMap: Record<string, number> = {};
    statusDistribution.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    // Format response with all statuses
    const distribution = [
      {
        status: 'Completed',
        count: statusMap['Completed'] || 0,
        color: '#10b981', // dark green
      },
      {
        status: 'In Progress',
        count: statusMap['In Progress'] || 0,
        color: '#3b82f6', // blue
      },
      {
        status: 'Accepted',
        count: statusMap['Accepted'] || 0,
        color: '#34d399', // light green
      },
      {
        status: 'Pending',
        count: (statusMap['Pending'] || 0) - unassignedCount, // Pending but assigned
        color: '#f97316', // orange
      },
      {
        status: 'Unassigned',
        count: unassignedCount,
        color: '#eab308', // yellow
      },
      {
        status: 'Canceled',
        count: statusMap['Cancelled'] || 0,
        color: '#ef4444', // red
      },
    ];

    return {
      status: 'success',
      message: 'Service requests snapshot fetched successfully',
      data: {
        total,
        distribution,
      },
    };
  }

  /**
   * Get status distribution (numerical breakdown)
   * Returns count for each status
   */
  async getStatusDistribution() {
    // Get distribution by status
    const statusDistribution = await this.serviceRequestModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get unassigned requests (Pending status with no care_giver)
    const unassignedCount = await this.serviceRequestModel
      .countDocuments({
        status: 'Pending',
        care_giver: null,
      })
      .exec();

    // Get pending count (total pending)
    const pendingCount = await this.serviceRequestModel
      .countDocuments({
        status: 'Pending',
      })
      .exec();

    // Map statuses
    const statusMap: Record<string, number> = {};
    statusDistribution.forEach((item) => {
      statusMap[item._id] = item.count;
    });

    const distribution = {
      completed: statusMap['Completed'] || 0,
      inProgress: statusMap['In Progress'] || 0,
      accepted: statusMap['Accepted'] || 0,
      pending: pendingCount - unassignedCount, // Pending but assigned
      unassigned: unassignedCount,
      canceled: statusMap['Cancelled'] || 0,
    };

    return {
      status: 'success',
      message: 'Status distribution fetched successfully',
      data: distribution,
    };
  }

  /**
   * Get geospatial insights (service requests by location)
   * Returns service requests grouped by city
   */
  async getGeospatialInsights() {
    // Get total count
    const total = await this.serviceRequestModel.countDocuments().exec();

    // Group by city
    const cityDistribution = await this.serviceRequestModel.aggregate([
      {
        $match: {
          'location.city': { $exists: true, $nin: ['', null] },
        },
      },
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Format response
    const cities = cityDistribution.map((item) => ({
      city: item._id,
      count: item.count,
    }));

    return {
      status: 'success',
      message: 'Geospatial insights fetched successfully',
      data: {
        total,
        cities,
      },
    };
  }
}
