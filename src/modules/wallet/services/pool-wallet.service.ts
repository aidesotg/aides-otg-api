import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { Mailer } from 'src/services/mailer.service';
import PlainMail from 'src/services/mailers/templates/plain-mail';
import { MiscCLass } from 'src/services/misc.service';
import * as crypto from 'crypto';
import constants, {
  FLUTTERWAVE_SUPPORTED_COUNTRIES,
  STRIPE_SUPPORTED_COUNTRIES,
} from 'src/framework/constants';
import { User } from 'src/modules/user/interface/user.interface';
import { UserService } from 'src/modules/user/services/user.service';
import { CreditDto } from 'src/modules/wallet/dto/credit.dto';
import { TransferDto } from 'src/modules/wallet/dto/transfer.dto';
import { Transaction } from 'src/modules/wallet/interface/transaction.interface';
import { WalletTransaction } from 'src/modules/wallet/interface/wallet-transaction.interface';
import { Wallet } from 'src/modules/wallet/interface/wallet.interface';
import * as otpGenerator from 'otp-generator';
import * as _ from 'lodash';
import { InjectStripe } from 'nestjs-stripe';
import Stripe from 'stripe';
import { StripeAccountDto } from 'src/modules/wallet/dto/stripe-account.dto';
import { WithdrawalOtp } from 'src/modules/wallet/interface/withdrawal-otp.interface';
import moment from 'moment';
import { WithdrawDto } from 'src/modules/wallet/dto/withdrawal.dto';
import { StripeService } from 'src/services/stripe.service';
import { ServiceRequestService } from 'src/modules/service-request/services/service-request.service';
import { PoolWalletTransaction } from '../interface/pool-wallet-transactions.interface';
import { PoolWallet } from '../interface/pool-wallet.interface';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Injectable()
export class PoolWalletService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    @InjectModel('PoolWalletTransaction')
    private readonly walletTransactionModel: Model<PoolWalletTransaction>,
    @InjectModel('PoolWallet')
    private readonly walletModel: Model<PoolWallet>,
    @Inject(forwardRef(() => UserService)) private userService: UserService,
    private miscService: MiscCLass,
    private mailerService: Mailer,
    private notificationService: NotificationService,
    private stripeService: StripeService,
    @InjectConnection() private readonly connection: Connection,
    @InjectStripe() private readonly stripe: Stripe,
  ) {}

  async walletTransactionMessage({ user, amount, type, details }) {
    const message = `Your Confidant wallet has been ${type}ed with USD${new Intl.NumberFormat(
      'en-US',
    ).format(Number(parseFloat(amount).toFixed(2)))}`;

    const title = `Activity on your account [${type.toUpperCase()}]`;

    // if (admin) {
    //   await this.notificationService.sendMessageOrganization(
    //     user,
    //     title,
    //     message,
    //     'wallet',
    //   );
    // } else {
    await this.notificationService.sendMessage({
      user,
      title,
      message,
      resource: 'wallet',
      // resource_id: wallet._id.toString(),
    });
    // }

    this.mailerService.send(
      new PlainMail(user.email, title, details, user, message),
    );
  }

  async getBalance(session?: any) {
    const wallet = await this.walletModel
      .findOne()
      .select('-createdAt -updatedAt')
      .session(session);
    if (!wallet) {
      throw new NotFoundException({
        status: 'error',
        message: 'Unable to get user wallet',
      });
    }
    return wallet;
  }

  async update(payload: any) {
    const {
      id,
      amount,
      description,
      details = '',
      genus,
      ref,
      type,
      session,
    } = payload;
    let user = null;
    let admin = null;

    const wallet = await this.getBalance(session);
    console.log('🚀 ~ WalletService ~ update ~ wallet:', wallet);

    const prev_balance = wallet.balance;
    let curr_balance: any = wallet.balance;

    if (type === 'credit') {
      curr_balance = _.add(prev_balance, amount);
    }
    if (type === 'debit') {
      curr_balance = _.subtract(prev_balance, amount);
    }

    const transaction = new this.walletTransactionModel({
      user: id,
      type,
      description,
      amount,
      prev_balance,
      curr_balance,
      confirmed: true,
      reference: ref ? ref : await this.miscService.referenceGenerator(),
      genus,
    });

    wallet.balance = Number(parseFloat(curr_balance).toFixed(2));
    await transaction.save({ session });
    await wallet.save({ session });

    return;
  }

  async updateLedger(payload: any) {
    const { id, amount, type } = payload;
    await this.userService.getUser({ _id: id });
    const wallet = await this.getBalance({ _id: id });

    let curr_balance = wallet.balance;
    let curr_ledger_balance = wallet.ledger_balance;

    if (type === 'credit') {
      curr_balance = _.subtract(wallet.balance, amount);
      curr_ledger_balance = _.add(wallet.ledger_balance, amount);
    }
    if (type === 'debit') {
      curr_ledger_balance = _.subtract(wallet.ledger_balance, amount);
      curr_balance = wallet.balance + amount;
    }

    wallet.balance = curr_balance;
    wallet.ledger_balance = curr_ledger_balance;
    await wallet.save();

    return;
  }

  async credit(payload: any, session?: any) {
    return await this.update({ ...payload, type: 'credit', session });
  }

  async debit(payload: any, session?: any) {
    return await this.update({ ...payload, type: 'debit', session });
  }

  async transfer(body: TransferDto, user: any) {
    const { user_id, amount } = body;
    //check if transfer is to self
    if (user._id == user_id) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Invalid recepient',
      });
    }
    //get sender wallet details
    const sender = await this.getBalance({ _id: user._id });
    //check balance
    if (amount > sender.balance) {
      throw new ForbiddenException({
        status: 'success',
        message: 'Insufficient funds in your wallet',
      });
    }
    //get recepient wallet
    await this.getBalance({ _id: user_id });
    const receiver = await this.userService.getUser({ _id: user_id });

    await this.debit({
      id: user._id,
      amount: amount,
      genus: constants.transactionGenus.TRANSFER,
      description: `Transfer to ${receiver.first_name}`,
    });

    await this.credit({
      id: user_id,
      amount: amount,
      genus: constants.transactionGenus.TRANSFER,
      description: `Transfer from ${user.first_name}`,
    });

    // const message = `₦${new Intl.NumberFormat('en-US').format(
    //   amount,
    // )} was tranferred to your wallet by ${user.full_name}`;

    // this.mailerService.send(
    //   new PlainMail(
    //     receiver.email,
    //     'Activity on your account [CREDIT]',
    //     '',
    //     receiver,
    //     message,
    //   ),
    // );

    return {
      status: 'success',
      message: 'Transfer successful',
    };
  }

  async canTransact(amount: number, userId: string) {
    const wallet = await this.getBalance({ _id: userId });

    if (!wallet) {
      return { status: false, message: 'wallet not found' };
    }
    if (wallet.balance < amount) {
      throw new ForbiddenException({
        status: 'success',
        message: 'Insufficient funds in your wallet',
      });
    }
    return true;
  }

  async getUserTransactions(params: any, user?: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = await this.miscService.search(rest);
    if (user && Object.keys(user).length) {
      query.user = user._id;
    }

    const transactions = await this.walletTransactionModel
      .find(query)
      .populate({
        path: 'user',
        select: constants.userPopulateFields,
      })
      .select('-updatedAt')
      .sort({ createdAt: -1 })
      .skip(pagination.offset)
      .limit(pagination.limit)
      .exec();

    const count = await this.walletTransactionModel
      .countDocuments(query)
      .exec();
    return {
      status: 'success',
      message: 'transactions fetched',
      data: {
        pagination: {
          ...(await this.miscService.pageCount({ count, page, pageSize })),
          total: count,
        },
        transactions,
      },
    };
  }

  async deleteWallet(user: string) {
    const wallet = await this.walletModel.findOne({ user });
    await wallet.remove();
    return;
  }
}
