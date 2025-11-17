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
    @Inject(forwardRef(() => ServiceRequestService))
    private serviceRequestService: ServiceRequestService,
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

    const intent = await this.stripeService.stripeCreatePaymentIntent({
      user,
      amount: Number(
        parseFloat(String(_.multiply(Number(amount), 100))).toFixed(2),
      ),
      currency,
      metadata: {
        customer_id: String(user._id),
        paymentType: body.type ?? user.details?.type ?? 'wallet',
        transaction_ref: ref,
      },
    });

    // Store both client_secret and payment_intent_id for webhook matching
    transaction.tx_ref = intent.client_secret;
    transaction.details = JSON.stringify({
      ...body,
      payment_intent_id: intent.id,
      client_secret: intent.client_secret,
      customer_id: intent.customer,
    });

    await transaction.save();
    return {
      status: 'success',
      data: {
        client_secret: intent.client_secret,
        customer: intent.customer,
        pub_key: process.env.STRIPE_PUB_KEY,
      },
    };
  }

  async initiate(body: any, user: any, origin?: string) {
    console.log('🚀 ~ WalletService ~ initiate ~ origin:', origin);
    console.log('🚀 ~ WalletService ~ initiate ~ body:', body);
    const { amount, payment_method, type } = body;
    const currency = body.currency ?? process.env.CURRENCY;
    const ref = await this.miscService.referenceGenerator();
    let response;

    // if (payment_method == 'stripe') {
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
      success_url:
        origin && body.path
          ? `${origin}${body.path}?session_id={CHECKOUT_SESSION_ID}`
          : `${process.env.APP_URL}/wallet/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        origin && body.path
          ? `${origin}${body.path}/canceled.html`
          : `${process.env.APP_URL}/canceled.html`,
    };
    response = await this.stripeService.stripeCreateCheckoutSession(
      orderPayload,
    );
    // }

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
        // Extract the object from the event.
        data = event.data.object;
        eventType = event.type;
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`);
        console.log(err);
        throw new ForbiddenException({
          status: 'error',
          message: 'Failed or Invalid Transaction',
        });
      }
    } else {
      // Webhook signing is recommended, but if the secret is not configured,
      // retrieve the event data directly from the request body.
      data = body.data?.object || body.object;
      eventType = body.type;
    }

    console.log(`📦 Received Stripe webhook: ${eventType}`);

    switch (eventType) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(data);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(data);
        break;
      case 'payment_intent.requires_action':
        await this.handlePaymentIntentRequiresAction(data);
        break;
      case 'checkout.session.completed':
        // Payment is successful and the subscription is created.
        if (data.mode == 'payment') {
          await this.handleCheckoutSessionCompleted(data);
        }
        break;
      case 'account.updated':
        await this.handleAccountUpdated(data);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return { received: true };
  }

  /**
   * Handle payment intent succeeded event
   * Handles Apple Pay, Google Pay, and regular card payments
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    console.log('✅ Payment Intent Succeeded:', paymentIntent.id);

    // Find transaction by payment intent ID, client secret, or metadata
    const searchQueries: any[] = [
      { tx_ref: paymentIntent.client_secret },
      { tx_ref: paymentIntent.id },
    ];

    // Also search in details JSON if it contains payment_intent_id
    if (paymentIntent.metadata?.transaction_ref) {
      searchQueries.push({ tx_ref: paymentIntent.metadata.transaction_ref });
    }

    let transaction = await this.transactionModel.findOne({
      $or: searchQueries,
    });

    // If not found, try searching in details JSON field
    if (!transaction) {
      const transactions = await this.transactionModel
        .find({
          $or: [
            { tx_ref: paymentIntent.client_secret },
            { tx_ref: paymentIntent.id },
          ],
        })
        .exec();

      transaction = transactions.find((t) => {
        try {
          const details = JSON.parse(t.details || '{}');
          return (
            details.payment_intent_id === paymentIntent.id ||
            details.client_secret === paymentIntent.client_secret
          );
        } catch {
          return false;
        }
      });
    }

    if (!transaction) {
      console.log(
        '⚠️ Transaction not found for payment intent:',
        paymentIntent.id,
      );
      return;
    }

    if (transaction.status === 'successful') {
      console.log('ℹ️ Transaction already processed');
      return;
    }

    // Retrieve payment method details to detect Apple Pay/Google Pay
    let paymentMethod: Stripe.PaymentMethod | null = null;
    let paymentMethodType = 'card';
    let isApplePay = false;
    let isGooglePay = false;

    if (paymentIntent.payment_method) {
      try {
        paymentMethod = await this.stripe.paymentMethods.retrieve(
          paymentIntent.payment_method as string,
        );

        // Detect Apple Pay or Google Pay
        if (paymentMethod.type === 'card' && paymentMethod.card) {
          // Check for Apple Pay indicators
          if (paymentMethod.card.wallet?.type === 'apple_pay') {
            isApplePay = true;
            paymentMethodType = 'apple_pay';
          }
          // Check for Google Pay indicators
          else if (paymentMethod.card.wallet?.type === 'google_pay') {
            isGooglePay = true;
            paymentMethodType = 'google_pay';
          }
        }
      } catch (error) {
        console.log('Error retrieving payment method:', error);
      }
    }

    // Credit wallet if transaction type is wallet
    if (transaction.type === 'wallet') {
      const amount = paymentIntent.amount / 100; // Convert from cents
      await this.credit({
        id: transaction.user,
        amount,
        genus: constants.transactionGenus.DEPOSIT,
        description: `Wallet deposit via ${paymentMethodType}`,
        ref: paymentIntent.id,
      });

      // Send notification
      const user = await this.userService.getUser({ _id: transaction.user });
      await this.walletTransactionMessage({
        user,
        amount,
        type: 'credit',
        details: `Wallet deposit via ${paymentMethodType}`,
      });
    }

    // update service request payment
    if (transaction.type === 'serviceRequest') {
      const user = await this.userService.getUser({ _id: transaction.user });
      await this.serviceRequestService.updateServiceRequestPayment(
        user,
        transaction,
      );
    }

    // Update transaction
    transaction.status = 'successful';
    transaction.trx_id = paymentIntent.id;
    transaction.payment_type = paymentMethodType;
    transaction.details = JSON.stringify({
      payment_intent_id: paymentIntent.id,
      payment_method_id: paymentIntent.payment_method,
      is_apple_pay: isApplePay,
      is_google_pay: isGooglePay,
      currency: paymentIntent.currency,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata,
    });

    await transaction.save();
    console.log('✅ Transaction processed successfully');
  }

  /**
   * Handle payment intent failed event
   */
  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('❌ Payment Intent Failed:', paymentIntent.id);

    let transaction = await this.transactionModel.findOne({
      $or: [
        { tx_ref: paymentIntent.client_secret },
        { tx_ref: paymentIntent.id },
        { 'details.payment_intent_id': paymentIntent.id },
      ],
    });

    if (transaction && transaction.status !== 'successful') {
      transaction.status = 'failed';
      transaction.details = JSON.stringify({
        payment_intent_id: paymentIntent.id,
        error: paymentIntent.last_payment_error,
        failure_reason: paymentIntent.last_payment_error?.message,
      });
      await transaction.save();
    }
  }

  /**
   * Handle payment intent requires action (e.g., 3D Secure)
   */
  private async handlePaymentIntentRequiresAction(
    paymentIntent: Stripe.PaymentIntent,
  ) {
    console.log('⚠️ Payment Intent Requires Action:', paymentIntent.id);

    let transaction = await this.transactionModel.findOne({
      $or: [
        { tx_ref: paymentIntent.client_secret },
        { tx_ref: paymentIntent.id },
        { 'details.payment_intent_id': paymentIntent.id },
      ],
    });

    if (transaction) {
      transaction.status = 'pending';
      transaction.details = JSON.stringify({
        payment_intent_id: paymentIntent.id,
        requires_action: true,
        next_action: paymentIntent.next_action,
      });
      await transaction.save();
    }
  }

  /**
   * Handle checkout session completed event
   */
  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
    console.log('✅ Checkout Session Completed:', session.id);

    let transaction = await this.transactionModel.findOne({
      $or: [{ tx_ref: session.client_reference_id }, { tx_ref: session.id }],
    });

    if (!transaction) {
      console.log('⚠️ Transaction not found for session:', session.id);
      return;
    }

    if (transaction.status === 'successful') {
      return;
    }

    // Retrieve payment intent to get payment method details
    let paymentIntent: Stripe.PaymentIntent | null = null;
    let paymentMethodType = 'card';
    let isApplePay = false;
    let isGooglePay = false;

    if (session.payment_intent) {
      try {
        paymentIntent = await this.stripe.paymentIntents.retrieve(
          session.payment_intent as string,
        );

        if (paymentIntent.payment_method) {
          const paymentMethod = await this.stripe.paymentMethods.retrieve(
            paymentIntent.payment_method as string,
          );

          if (paymentMethod.type === 'card' && paymentMethod.card) {
            if (paymentMethod.card.wallet?.type === 'apple_pay') {
              isApplePay = true;
              paymentMethodType = 'apple_pay';
            } else if (paymentMethod.card.wallet?.type === 'google_pay') {
              isGooglePay = true;
              paymentMethodType = 'google_pay';
            }
          }
        }
      } catch (error) {
        console.log('Error retrieving payment intent:', error);
      }
    }

    // Credit wallet if transaction type is wallet
    if (transaction.type === 'wallet') {
      const amount = (session.amount_total || 0) / 100; // Convert from cents
      await this.credit({
        id: transaction.user,
        amount,
        genus: constants.transactionGenus.DEPOSIT,
        description: `Wallet deposit via ${paymentMethodType}`,
        ref: session.client_reference_id || session.id,
      });

      // Send notification
      const user = await this.userService.getUser({ _id: transaction.user });
      await this.walletTransactionMessage({
        user,
        amount,
        type: 'credit',
        details: `Wallet deposit via ${paymentMethodType}`,
      });
    }

    // update service request payment
    if (transaction.type === 'serviceRequest') {
      const user = await this.userService.getUser({ _id: transaction.user });
      await this.serviceRequestService.updateServiceRequestPayment(
        user,
        transaction,
      );
    }

    // Update transaction
    transaction.status = 'successful';
    transaction.trx_id = session.id;
    transaction.payment_type = paymentMethodType;
    transaction.details = JSON.stringify({
      session_id: session.id,
      payment_intent_id: session.payment_intent,
      is_apple_pay: isApplePay,
      is_google_pay: isGooglePay,
      amount_total: session.amount_total,
      currency: session.currency,
      customer: session.customer,
      metadata: session.metadata,
    });

    await transaction.save();
    console.log('✅ Checkout session processed successfully');
  }

  /**
   * Handle account updated event
   */
  private async handleAccountUpdated(account: Stripe.Account) {
    console.log('📝 Account Updated:', account.id);

    const user = await this.userModel.findOne({
      'stripeConnect.stripeCustomerId': account.id,
    });

    if (user) {
      user.stripeConnect.active =
        account.charges_enabled && account.details_submitted;
      await user.save();
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  public async handleStripeResponse(transaction, data) {
    console.log('🚀 ~ WalletService ~ handleStripeResponse ~ data:', data);

    if (!transaction) {
      transaction = await this.transactionModel.findOne({
        $or: [
          { tx_ref: data.client_secret },
          { tx_ref: data.client_reference_id },
          { tx_ref: data.id },
        ],
      });
    }

    if (!transaction) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Invalid Transaction',
      });
    }

    if (transaction.status === 'successful') {
      return {
        status: 'success',
        message: 'Transaction successful',
      };
    }

    if (
      transaction.status !== 'successful' &&
      transaction.status !== 'initiated'
    ) {
      throw new ForbiddenException({
        status: 'error',
        message: 'Failed or Invalid Transaction',
      });
    }

    if (transaction.type === 'wallet') {
      const amount = data.amount_total
        ? data.amount_total / 100
        : transaction.amount;
      await this.credit({
        id: transaction.user,
        amount,
        genus: constants.transactionGenus.DEPOSIT,
        description: 'wallet deposit',
        ref: data.client_reference_id || data.id,
      });
    }

    transaction.status = 'successful';
    transaction.narration = data.narration;
    transaction.payment_type = data.payment_method_types?.[0] || 'card';
    transaction.trx_id = data.id;
    transaction.app_fee = data.application_fee_amount
      ? data.application_fee_amount / 100
      : null;
    transaction.customer = JSON.stringify(data.customer);
    transaction.card = JSON.stringify(data.payment_method_types);

    await transaction.save();
    return { status: 'success', message: 'Transaction processed' };
  }

  async getSupportedCountries() {
    return [...STRIPE_SUPPORTED_COUNTRIES, ...FLUTTERWAVE_SUPPORTED_COUNTRIES];
  }
}
