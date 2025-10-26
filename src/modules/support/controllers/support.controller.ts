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
import { SupportService } from '../services/support.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CreateTicketMessageDto,
  TicketQueryDto,
} from '../dto/support.dto';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('/my-tickets')
  @UseGuards(AuthGuard('jwt'))
  async getTickets(@Query() params: TicketQueryDto, @AuthUser() user: any) {
    const tickets = await this.supportService.getTickets(params, user);
    return {
      status: 'success',
      message: 'Tickets fetched',
      data: tickets,
    };
  }

  @Get('/tickets/:id')
  @UseGuards(AuthGuard('jwt'))
  async getTicketById(@Param('id') id: string) {
    const ticket = await this.supportService.getTicketById(id);
    return {
      status: 'success',
      message: 'Ticket fetched',
      data: { ticket },
    };
  }

  @Get('/tickets/:id/messages')
  @UseGuards(AuthGuard('jwt'))
  async getTicketMessages(@Param('id') id: string, @Query() params: any) {
    const messages = await this.supportService.getTicketMessages(id, params);
    return {
      status: 'success',
      message: 'Ticket messages fetched',
      data: messages,
    };
  }

  @Post('/tickets/create')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createTicket(@Body() body: CreateTicketDto, @AuthUser() user: any) {
    return this.supportService.createTicket(body, user);
  }

  @Put('/tickets/:id/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateTicket(@Param('id') id: string, @Body() body: UpdateTicketDto) {
    return this.supportService.updateTicket(id, body);
  }

  @Post('/tickets/:id/messages')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async addTicketMessage(
    @Param('id') id: string,
    @Body() body: CreateTicketMessageDto,
    @AuthUser() user: any,
  ) {
    return this.supportService.addTicketMessage(id, body, user);
  }

  @Put('/tickets/:id/assign')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async assignTicket(
    @Param('id') id: string,
    @Body('assigned_to') assignedTo: string,
  ) {
    return this.supportService.assignTicket(id, assignedTo);
  }

  @Put('/tickets/:id/close')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async closeTicket(@Param('id') id: string) {
    return this.supportService.closeTicket(id);
  }

  @Delete('/tickets/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteTicket(@Param('id') id: string) {
    return this.supportService.deleteTicket(id);
  }
}
