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
  Headers,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { CreditDto } from 'src/modules/wallet/dto/credit.dto';
import { WalletService } from 'src/modules/wallet/services/wallet.service';
import { TransferDto } from 'src/modules/wallet/dto/transfer.dto';
import { FlutterwaveService } from 'src/services/flutterwave.service';
import { UserService } from 'src/modules/user/services/user.service';
import { StripeAccountDto } from 'src/modules/wallet/dto/stripe-account.dto';
import { WithdrawDto } from 'src/modules/wallet/dto/withdrawal.dto';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { AuthUser } from 'src/framework/decorators/user.decorator';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly flutterwaveService: FlutterwaveService,
    private readonly userService: UserService,
  ) {}

  @Post('/credit')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async intiate(
    @Body() body: CreditDto,
    @AuthUser() user: any,
    @Headers('origin') origin: string,
  ) {
    console.log('header===>', origin);
    return this.walletService.initiate(body, user, origin);
  }

  @Post('/credit-mobile')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async intiateMobile(@Body() body: CreditDto, @AuthUser() user: any) {
    return this.walletService.initiateMobile(body, user);
  }

  @Get('/balance/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getUserBalance(@Param('id') id: string) {
    return this.walletService.getUserBalance({ _id: id });
  }

  @Get('/banks/list')
  // @UseGuards(AuthGuard('jwt'))
  async getBanks(@Query() query: any) {
    return this.walletService.getBankList(query.country_code);
  }

  @Get('/withdraw/rate/:currency')
  // @UseGuards(AuthGuard('jwt'))
  async getWithdrawalRate(@Param('currency') currency: any) {
    return this.walletService.getTransferRates(currency);
  }

  @Get('/balance')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getBalance(@AuthUser() user: any) {
    return this.walletService.getUserBalance(user);
  }

  @Get('/transactions/all')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getAllTransactions(@Query() query: any) {
    return this.walletService.getUserTransactions(query);
  }

  @Get('/transactions/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getUserTransactions(@Param('id') id: string, @Query() query: any) {
    return this.walletService.getUserTransactions(query, { _id: id });
  }

  @Get('/transactions')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getTransactions(@AuthUser() user: any, @Query() query: any) {
    return this.walletService.getUserTransactions(query, user);
  }

  @Get('/confirmation')
  @UseFilters(ExceptionsLoggerFilter)
  async confirmation(@Query() query: any) {
    // return this.walletService.confirmation(query);
    return {
      status: 'success',
      message: 'Transaction processing',
    };
  }

  @Get('/withdraw/supported-countries')
  @UseFilters(ExceptionsLoggerFilter)
  async withdrawal(@Query() query: any) {
    const countries = await this.walletService.getSupportedCountries();
    return {
      status: 'success',
      message: 'Countries fetched',
      data: countries,
    };
  }

  @Get('/verify-wallet')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getUserWallet(@Query() query: any, @AuthUser() user: any) {
    return this.walletService.checkWallet(query, user);
  }

  @Post('/stripe/onboard')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createStripeAccount(
    @AuthUser() user: any,
    @Body() body: StripeAccountDto,
  ) {
    return this.walletService.createStripeAccount(user, body);
  }

  @Put('/transfer')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async transfer(@Body() body: TransferDto, @AuthUser() user: any) {
    return this.walletService.transfer(body, user);
  }

  @Put('/withdraw')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async withdraw(@AuthUser() user: any, @Body() body: WithdrawDto) {
    return this.walletService.requestWithdraw(body, user);
  }

  @Put('/withdraw/confirm')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async confirmWithdrawalOtp(@AuthUser() user: any, @Body('otp') otp: string) {
    return this.walletService.confirmWithdrawOtp(otp, user);
  }

  // @Post('/banks/verify')
  // @UseGuards(AuthGuard('jwt'))
  // @UseFilters(ExceptionsLoggerFilter)
  // async verifyBank(@Body() body: VerifyBankDto) {
  //   return this.userService.verifyBankDetails(body);
  // }

  @Post('/webhook')
  // @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async webhook(@Body() body: any, @Headers() headers: any) {
    return this.walletService.webhook(body, headers);
  }

  @Post('/webhook/stripe')
  // @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async webhookStripe(
    @Body() body: any,
    @Headers() headers: any,
    @Body() payload,
    @Req() req,
    @Res() res,
  ) {
    return this.walletService.stripeWebhookSignatureVerification(req, body);
  }
}
