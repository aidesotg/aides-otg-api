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
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

@Injectable()
export class WalletService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<User>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    @InjectModel('WalletTransaction')
    private readonly walletTransactionModel: Model<WalletTransaction>,
    @InjectModel('Wallet')
    private readonly walletModel: Model<Wallet>,
    @InjectModel('WithdrawalOtp')
    private readonly withdrawalOtpModel: Model<WithdrawalOtp>,
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

  async createWallet(user: User, email: string, type?: string) {
    let wallet = await this.walletModel.findOne({ user: user._id });
    if (!wallet) {
      const newWallet = new this.walletModel({
        user: user._id,
        email,
        type: type ?? 'individual',
      });
      wallet = await newWallet.save();
    }
    return wallet;
  }

  async getBalance(user: any, session?: any) {
    const wallet = await this.walletModel
      .findOne({ user: user._id })
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
      group,
      groupId,
      session,
    } = payload;
    let user = null;
    let admin = null;

    const wallet = await this.getBalance({ _id: id }, session);
    console.log('🚀 ~ WalletService ~ update ~ wallet:', wallet);

    if (wallet.type == 'individual' || !wallet.type) {
      user = await this.userService.getUser({ _id: id });
    }

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
      group: group ?? false,
      groupId: groupId ?? null,
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

  async initiateMobile(body: any, user: any) {
    const { amount, payment_method } = body;
    const currency = process.env.CURRENCY ?? body.currency;
    const ref = await this.miscService.referenceGenerator();

    await this.userService.getUser(user._id);

    const transaction = new this.transactionModel({
      tx_ref: ref,
      user: user._id,
      email: user.email,
      fullname: `${user.first_name} ${user.last_name}`,
      currency,
      amount,
      status: 'initiated',
      type: body.type ?? user.details?.type ?? 'wallet',
      details: JSON.stringify(body),
      group: body.group ?? false,
    });

    //   console.log(redirect_url);

    if (payment_method == 'stripe') {
      const intent = await this.stripeService.stripeCreatePaymentIntent({
        user,
        amount: Number(
          parseFloat(String(_.multiply(Number(amount), 100))).toFixed(2),
        ),
        currency,
        metadata: {
          customer_id: String(user._id),
          paymentType: body.type ?? user.details?.type ?? 'wallet',
        },
      });
      transaction.tx_ref = intent.client_secret;

      await transaction.save();
      return {
        status: 'success',
        data: {
          client_secret: intent.client_secret,
          customer: intent.customer,
          pub_key: process.env.STRIPE_PUB_KEY,
        },
      };
    } else {
      await transaction.save();
      return {
        status: 'success',
        data: {
          tx_ref: ref,
          amount,
          currency,
          flwpubk: process.env.FLUTTERWAVE_PUBLIC_KEY,
          flwenckey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
        },
        // data: {
        //   tx_ref: ref,
        //   amount: _.multiply(amount, 100),
        //   currency,
        //   email: user.email,
        //   paystackpubk: process.env.PAYSTACK_PUBLIC_KEY,
        // },
      };
    }
  }

  async initiate(body: any, user: any, origin?: string) {
    console.log('🚀 ~ WalletService ~ initiate ~ origin:', origin);
    console.log('🚀 ~ WalletService ~ initiate ~ body:', body);
    const { amount, payment_method } = body;
    const currency = body.currency ?? process.env.CURRENCY;
    const ref = await this.miscService.referenceGenerator();
    let response;

    if (payment_method == 'stripe') {
      const orderPayload = {
        reference: ref,
        user,
        origin,
        metadata: {
          customer_id: String(user._id),
          paymentType: body.type ?? user.details?.type ?? 'wallet',
        },
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: `Payment of ${currency}${amount}`,
              },
              unit_amount: Number(
                parseFloat(String(_.multiply(Number(amount), 100))).toFixed(2),
              ),
            },
            // For metered billing, do not pass quantity
            quantity: 1,
            // currency: process.env.CURRENCY
          },
        ],
        success_url: origin
          ? `${origin}${body.path}?session_id={CHECKOUT_SESSION_ID}`
          : `${process.env.APP_URL}/wallet/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: origin
          ? `${origin}${body.path}/canceled.html`
          : `${process.env.APP_URL}/canceled.html`,
      };
      response = await this.stripeService.stripeCreateCheckoutSession(
        orderPayload,
      );
    }

    await this.userService.getUser(user._id);

    const transaction = new this.transactionModel({
      tx_ref: ref,
      user: user._id,
      email: user.email,
      fullname: `${user.first_name} ${user.last_name}`,
      currency,
      amount,
      status: 'initiated',
      type: body.type ?? user.details?.type ?? 'wallet',
      details: JSON.stringify(body),
      group: body.group ?? false,
    });

    await transaction.save();

    return {
      status: 'success',
      data: {
        checkoutUrl: response,
      },
    };
  }

  async checkWallet(query: any, user: any) {
    if (user.first_name == query.first_name) {
      throw new ForbiddenException({
        status: 'success',
        message: 'Invalid recepient',
      });
    }

    const walletHolder = await this.userModel.findOne({
      first_name: query.first_name,
    });
    if (!walletHolder) {
      throw new NotFoundException({
        status: 'error',
        message: 'User not found',
      });
    }

    await this.getBalance({ _id: walletHolder._id });

    return {
      status: 'success',
      data: {
        user: {
          name: `${walletHolder.first_name} ${walletHolder.last_name}`,
          id: walletHolder._id,
        },
      },
    };
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

  async canCall(amount: number, userId: any) {
    const wallet = await this.getBalance({ _id: userId });

    if (!wallet) {
      return { status: false, message: 'wallet not found' };
    }
    if (wallet.tokens < amount) {
      throw new ForbiddenException({
        status: 'success',
        message: 'Insufficient tokens',
      });
    }
    return true;
  }

  async requestWithdraw(body: WithdrawDto, user: any) {
    await this.canTransact(body.amount, user._id);

    if (body.processor.toLowerCase() == 'flutterwave') {
      if (!body.account_number || !body.bank_code) {
        throw new BadRequestException({
          status: 'error',
          message: 'Please provide account number and bank code',
        });
      }
    }

    if (body.processor.toLowerCase() == 'stripe') {
      if (
        !user.stripeConnect?.stripeCustomerId ||
        !user.stripeConnect?.active
      ) {
        throw new BadRequestException({
          status: 'error',
          message: 'Please connect your stripe account to proceed',
        });
      }
    }

    const code = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      specialChars: false,
      upperCase: false,
    });
    const expires = moment().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');

    await this.withdrawalOtpModel.updateMany(
      { user: user._id },
      { used: true },
    );

    const newWithdrawal = new this.withdrawalOtpModel({
      user: user._id,
      details: JSON.stringify(body),
      expiry: new Date(expires),
      otp: code,
    });

    await newWithdrawal.save();

    // this.mailerService.send(
    //   new WithdrawalOtpMail(
    //     user.email,
    //     '*Do not disclose, OTP*',
    //     user,
    //     code,
    //     body.amount,
    //   ),
    // );

    return {
      status: 'success',
      message:
        'An OTP has been sent to your registered email address to complete your withdrawal',
    };
  }

  async confirmWithdrawOtp(otp: string, user: any) {
    const withdrawalAttempt = await this.withdrawalOtpModel
      .findOne({ otp, used: false, user: user._id })
      .exec();

    if (!withdrawalAttempt) {
      throw new BadRequestException({
        status: 'error',
        message: 'Invalid otp',
      });
    }

    const time = new Date().getTime();
    const expires_in = new Date(withdrawalAttempt.expiry).getTime();

    if (time > expires_in) {
      throw new BadRequestException({
        status: 'error',
        message: 'otp has expired',
      });
    }

    withdrawalAttempt.expiry = null;
    withdrawalAttempt.used = true;

    await withdrawalAttempt.save();

    const body = JSON.parse(withdrawalAttempt.details);

    await this.canTransact(body.amount, user._id);
    let withdrawal;

    const ref = await this.miscService.referenceGenerator();

    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      await this.debit(
        {
          id: user._id,
          amount: body.amount,
          genus: constants.transactionGenus.WITHDRAWAL,
          description: `Withdrawal from your The Confidant wallet`,
          ref,
        },
        session,
      );

      await this.withdraw(body, user);
      // response = await this.paystackService.createTransfer(payload);
    });
    session.endSession();

    await this.walletTransactionMessage({
      user,
      amount: body.amount,
      type: 'debit',
      details: 'Withdrawal from your The Confidant wallet',
    });

    return {
      status: 'success',
      message: 'Withdrawal in progress',
    };
  }

  async withdraw(body: WithdrawDto, user: any) {
    const { currency, account_number, bank_code, processor } = body;
    const userDetails = await this.userModel.findOne({ _id: user._id });
    let response;
    await this.canTransact(body.amount, user._id);

    const ref = await this.miscService.referenceGenerator();

    if (processor == 'stripe') {
      await this.stripe.transfers.create({
        amount: _.multiply(body.amount, 100),
        currency: 'usd',
        destination: userDetails.stripeConnect.stripeCustomerId,
        description: 'Withdrawal from your Confidant wallet',
        metadata: {
          userId: String(userDetails._id),
        },
      });

      try {
        await this.stripe.payouts.create(
          {
            amount: _.multiply(body.amount, 100),
            currency: 'usd',
            method: 'instant',
            metadata: {
              userId: String(userDetails._id),
            },
          },
          { stripeAccount: userDetails.stripeConnect.stripeCustomerId },
        );
      } catch (err) {
        console.log(err);
      }

      // return transfer;
    }

    return;
  }

  async getUserBalance(user: any) {
    const stats: any = {
      transfer: 0,
      withdrawal: 0,
      deposit: 0,
      payment: 0,
      // referral: 0,
      earned: 0,
    };
    const walletBalance = await this.getBalance(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, __v, id, ...rest } = walletBalance.toObject();

    const transactions = await this.walletTransactionModel
      .find({ user: user._id })
      .select('-updatedAt')
      .sort({ createdAt: -1 })
      .limit(3);

    const breakdown = await this.walletTransactionModel.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$genus',
          total: { $sum: '$amount' },
        },
      },
    ]);

    for (const value of breakdown) {
      if (Object.keys(stats).includes(value?._id.toLowerCase())) {
        stats[value._id.toLowerCase()] = value.total;
      }
    }

    return {
      status: 'success',
      message: 'wallet fetched successfully',
      data: {
        wallet: rest,
        stats,
        transactions,
      },
    };
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

  async createStripeAccount(user: any, payload: StripeAccountDto) {
    return this.stripeService.createStripeAccount({
      user: user._id,
      ...payload,
    });
  }

  public async stripeWebhookSignatureVerification(req: any, body: any) {
    let data;
    let eventType;
    // Check if webhook signing is configured.
    const webhookSecret = null;
    let transaction = null;

    if (webhookSecret) {
      // Retrieve the event by verifying the signature using the raw body and secret.
      let event;
      const signature = req.headers['stripe-signature'];

      try {
        event = await this.stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          webhookSecret,
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`);
        console.log(err);
        throw new ForbiddenException({
          status: 'success',
          message: 'Failed or Invalid Transaction',
        });
      }
      // Extract the object from the event.
      data = event.data.object;
      eventType = event.type;
    } else {
      // Webhook signing is recommended, but if the secret is not configured in `config.js`,
      // retrieve the event data directly from the request body.
      data = body.data.object;
      eventType = body.type;
    }

    let response;

    switch (eventType) {
      case 'payment_intent.succeeded':
        // await this.handleStripeResponse(transaction, data);
        break;
      case 'payment_intent.payment_failed':
        break;
      case 'checkout.session.completed':
        // Payment is successful and the subscription is created.\

        if (data.mode == 'payment') {
          await this.handleStripeResponse(transaction, data);
        }
        break;
      case 'account.updated':
        console.log('CHARGES', !data.charges_enabled);

        const user = await this.userModel.findOne({
          'stripeConnect.stripeCustomerId': data.id,
        });
        user.stripeConnect.active = data.charges_enabled;
        await user.save();
        break;
      default:
    }

    return;
  }

  public async handleStripeResponse(transaction, data) {
    console.log('🚀 ~ WalletService ~ handleStripeResponse ~ data:', data);
    transaction = await this.transactionModel.findOne({
      $or: [
        { tx_ref: data.client_secret },
        { tx_ref: data.client_reference_id },
      ],
      // status: 'initiated',
    });
    if (!transaction) {
      throw new ForbiddenException({
        status: 'success',
        message: 'Invalid Transaction',
      });
    }
    if (transaction.status == 'successful') {
      return {
        status: 'success',
        message: 'Transaction successful',
      };
    }

    if (
      transaction.status != 'successful' &&
      transaction.status != 'initiated'
    ) {
      throw new ForbiddenException({
        status: 'success',
        message: 'Failed or Invalid Transaction',
      });
    }
    let response;
    if (transaction.type == 'wallet') {
      await this.credit({
        id: transaction.user,
        amount: transaction.amount,
        genus: constants.transactionGenus.DEPOSIT,
        description: 'wallet deposit',
        ref: data.client_reference_id,
      });
    }

    transaction.status = 'successful';
    transaction.narration = data.narration;
    transaction.payment_type = data.payment_methods;
    transaction.trx_id = data.id;
    // transaction.charged_amount = data.amount_total / 100;
    // transaction.flw_ref = data.flw_ref;
    transaction.app_fee = data.app_fee;
    transaction.customer = JSON.stringify(data.customer);
    transaction.card = JSON.stringify(data.card);

    await transaction.save();
    return response;
  }

  async getSupportedCountries() {
    return [...STRIPE_SUPPORTED_COUNTRIES, ...FLUTTERWAVE_SUPPORTED_COUNTRIES];
  }
}
