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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WalletService } from './wallet.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  FundWalletDto,
  WithdrawWalletDto,
  TransferWalletDto,
  TransactionQueryDto,
} from './dto/wallet.dto';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getWallet(@AuthUser() user: any) {
    const wallet = await this.walletService.getWallet(user);
    return {
      status: 'success',
      message: 'Wallet details fetched',
      data: { wallet },
    };
  }

  @Get('/transactions')
  @UseGuards(AuthGuard('jwt'))
  async getTransactions(
    @Query() params: TransactionQueryDto,
    @AuthUser() user: any,
  ) {
    const transactions = await this.walletService.getTransactions(params, user);
    return {
      status: 'success',
      message: 'Transactions fetched',
      data: transactions,
    };
  }

  @Get('/transactions/:id')
  @UseGuards(AuthGuard('jwt'))
  async getTransactionById(@Param('id') id: string) {
    const transaction = await this.walletService.getTransactionById(id);
    return {
      status: 'success',
      message: 'Transaction fetched',
      data: { transaction },
    };
  }

  @Post('/fund')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async fundWallet(@Body() body: FundWalletDto, @AuthUser() user: any) {
    return this.walletService.fundWallet(body, user);
  }

  @Post('/withdraw')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async withdrawWallet(@Body() body: WithdrawWalletDto, @AuthUser() user: any) {
    return this.walletService.withdrawWallet(body, user);
  }

  @Post('/transfer')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async transferWallet(@Body() body: TransferWalletDto, @AuthUser() user: any) {
    return this.walletService.transferWallet(body, user);
  }

  @Get('/admin/transactions')
  @UseGuards(AuthGuard('jwt'))
  async getAllTransactions(@Query() params: TransactionQueryDto) {
    const transactions = await this.walletService.getAllTransactions(params);
    return {
      status: 'success',
      message: 'All transactions fetched',
      data: transactions,
    };
  }

  @Put('/admin/transactions/:id/settle')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async settleTransaction(@Param('id') id: string) {
    return this.walletService.settleTransaction(id);
  }

  @Put('/admin/transactions/:id/refund')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async refundTransaction(@Param('id') id: string) {
    return this.walletService.refundTransaction(id);
  }
}
