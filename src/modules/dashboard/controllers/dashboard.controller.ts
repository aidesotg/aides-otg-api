import { Controller, Get, Query, UseGuards, UseFilters } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/summary')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getSummaryStatistics() {
    return this.dashboardService.getSummaryStatistics();
  }

  @Get('/user-growth-trend')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getUserGrowthTrend(
    @Query('timeframe') timeframe?: 'daily' | 'weekly' | 'monthly',
  ) {
    return this.dashboardService.getUserGrowthTrend(timeframe || 'weekly');
  }

  @Get('/unassigned-requests')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getUnassignedRequests(@Query() params: any) {
    return this.dashboardService.getUnassignedRequests(params);
  }

  @Get('/service-requests-snapshot')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getServiceRequestsSnapshot() {
    return this.dashboardService.getServiceRequestsSnapshot();
  }

  @Get('/status-distribution')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getStatusDistribution() {
    return this.dashboardService.getStatusDistribution();
  }

  @Get('/geospatial-insights')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getGeospatialInsights() {
    return this.dashboardService.getGeospatialInsights();
  }
}
