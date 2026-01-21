import {
  Controller,
  Get,
  Put,
  UseGuards,
  UseFilters,
  Query,
  Body,
  Post,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/framework/decorators/permissions.decorator';
import { PermissionsGuard } from 'src/framework/guards/permissions.guard';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { CreateBroadcastDto } from 'src/modules/notification/dto/broadcast.dto';
import { NotificationService } from 'src/modules/notification/services/notification.service';

@ApiTags('notification')
@Controller('notification')
export class NotificationController {
  constructor(private notificationService: NotificationService) { }

  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getNotificatons(@AuthUser() user: any, @Query() query: any) {
    return this.notificationService.fetchUserNotifications(user, query);
  }

  @Put('/open/all')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async openNotifications(@AuthUser() user: any) {
    return this.notificationService.openNotifications(user);
  }

  @Put('/open/:notificationId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async openNotification(
    @AuthUser() user: any,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.openNotification(user, notificationId);
  }

  @Get('/broadcast')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('broadcast:read')
  @UseFilters(ExceptionsLoggerFilter)
  async getBroadcast(@Query() query: any) {
    return this.notificationService.getBroadcasts(query);
  }

  @Get('/broadcast/:broadcastId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('broadcast:read')
  @UseFilters(ExceptionsLoggerFilter)
  async getBroadcasts(@Param('broadcastId') broadcastId: string) {
    return this.notificationService.getSingleBroadcast(broadcastId);
  }

  @Post('/broadcast/create')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('broadcast:create')
  @UseFilters(ExceptionsLoggerFilter)
  async createBroadcast(@Body() body: CreateBroadcastDto) {
    return this.notificationService.createBroadcast(body);
  }

  @Post('/broadcast/:broadcastId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('broadcast:create')
  @UseFilters(ExceptionsLoggerFilter)
  async resendBroadcast(@Param('broadcastId') broadcastId: string) {
    return this.notificationService.resendBroadcast(broadcastId);
  }

  @Put('/broadcast/:broadcastId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('broadcast:update')
  @UseFilters(ExceptionsLoggerFilter)
  async editBroadcast(
    @Param('broadcastId') broadcastId: string,
    @Body() body: Partial<CreateBroadcastDto>,
  ) {
    return this.notificationService.editBroadcast(broadcastId, body);
  }

  @Delete('/broadcast/:broadcastId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions('broadcast:delete')
  @UseFilters(ExceptionsLoggerFilter)
  async deleteBroadcast(@Param('broadcastId') broadcastId: string) {
    return this.notificationService.deleteBroadcast(broadcastId);
  }
}
