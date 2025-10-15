import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet } from './interface/wallet.interface';
import { Transaction } from './interface/transaction.interface';
import {
  FundWalletDto,
  WithdrawWalletDto,
  TransferWalletDto,
  TransactionQueryDto,
} from './dto/wallet.dto';
import { MiscCLass } from 'src/services/misc.service';
import { FlutterwaveService } from 'src/services/flutterwave.service';
import { UserService } from 'src/modules/user/user.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel('Wallet') private readonly walletModel: Model<Wallet>,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    private miscService: MiscCLass,
    private flutterwaveService: FlutterwaveService,
    private userService: UserService,
  ) {}

  async getWallet(user: any) {
    let wallet = await this.walletModel
      .findOne({ user: user._id, is_deleted: false })
      .populate('user', ['fullname', 'email'])
      .exec();

    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = await this.createWallet(user);
    }

    return wallet;
  }

  async createWallet(user: any) {
    const newWallet = new this.walletModel({
      user: user._id,
      balance: 0,
      ledger_balance: 0,
    });

    return await newWallet.save();
  }

  async getTransactions(params: any, user: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const wallet = await this.getWallet(user);
    const query: any = { wallet: wallet._id, is_deleted: false };

    if (rest.type) query.type = rest.type;
    if (rest.category) query.category = rest.category;
    if (rest.status) query.status = rest.status;

    if (rest.start_date || rest.end_date) {
      query.createdAt = {};
      if (rest.start_date) query.createdAt.$gte = new Date(rest.start_date);
      if (rest.end_date) query.createdAt.$lte = new Date(rest.end_date);
    }

    const transactions = await this.transactionModel
      .find(query)
      .populate('wallet', ['balance', 'ledger_balance'])
      .populate('user', ['fullname', 'email'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.transactionModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      transactions,
    };
  }

  async getTransactionById(id: string) {
    const transaction = await this.transactionModel
      .findOne({ _id: id, is_deleted: false })
      .populate('wallet', ['balance', 'ledger_balance'])
      .populate('user', ['fullname', 'email'])
      .populate('booking')
      .populate('insurance', ['name'])
      .exec();

    if (!transaction) {
      throw new NotFoundException({
        status: 'error',
        message: 'Transaction not found',
      });
    }

    return transaction;
  }

  async fundWallet(fundWalletDto: FundWalletDto, user: any) {
    const wallet = await this.getWallet(user);

    // Generate unique reference
    const reference = `FUND_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create transaction record
    const transaction = new this.transactionModel({
      wallet: wallet._id,
      user: user._id,
      amount: fundWalletDto.amount,
      type: 'credit',
      category: 'deposit',
      description: fundWalletDto.description || 'Wallet funding',
      reference,
      status: 'pending',
      payment_method: fundWalletDto.payment_method,
    });

    await transaction.save();

    // Process payment based on method
    let paymentResult;
    try {
      switch (fundWalletDto.payment_method) {
        case 'flutterwave':
          paymentResult = await this.flutterwaveService.initiateTransaction({
            amount: fundWalletDto.amount,
            email: user.email,
            reference,
            callback_url: `${process.env.APP_URL}/wallet/callback`,
          });
          break;
        default:
          throw new BadRequestException('Payment method not supported');
      }

      // Update transaction with payment reference
      transaction.payment_reference = paymentResult.data.reference;
      await transaction.save();

      return {
        status: 'success',
        message: 'Payment initialized',
        data: {
          transaction,
          payment_url: paymentResult.data.authorization_url,
        },
      };
    } catch (error) {
      transaction.status = 'failed';
      await transaction.save();
      throw new HttpException('Payment initialization failed', 400);
    }
  }

  async withdrawWallet(withdrawWalletDto: WithdrawWalletDto, user: any) {
    const wallet = await this.getWallet(user);

    if (wallet.balance < withdrawWalletDto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const reference = `WITHDRAW_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const transaction = new this.transactionModel({
      wallet: wallet._id,
      user: user._id,
      amount: withdrawWalletDto.amount,
      type: 'debit',
      category: 'withdrawal',
      description: withdrawWalletDto.description || 'Wallet withdrawal',
      reference,
      status: 'pending',
      payment_method: 'bank_transfer',
      metadata: {
        bank_account: withdrawWalletDto.bank_account,
        bank_name: withdrawWalletDto.bank_name,
        account_name: withdrawWalletDto.account_name,
      },
    });

    await transaction.save();

    // Deduct from wallet balance
    wallet.balance -= withdrawWalletDto.amount;
    await wallet.save();

    return {
      status: 'success',
      message: 'Withdrawal request submitted',
      data: { transaction },
    };
  }

  async transferWallet(transferWalletDto: TransferWalletDto, user: any) {
    const senderWallet = await this.getWallet(user);

    if (senderWallet.balance < transferWalletDto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Find recipient
    const recipient = await this.userService.getUser({
      email: transferWalletDto.recipient_email,
    });
    const recipientWallet = await this.getWallet(recipient);

    const reference = `TRANSFER_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Create debit transaction for sender
    const debitTransaction = new this.transactionModel({
      wallet: senderWallet._id,
      user: user._id,
      amount: transferWalletDto.amount,
      type: 'debit',
      category: 'payment',
      description: `Transfer to ${recipient.fullname}`,
      reference: `${reference}_DEBIT`,
      status: 'completed',
      payment_method: 'wallet',
    });

    // Create credit transaction for recipient
    const creditTransaction = new this.transactionModel({
      wallet: recipientWallet._id,
      user: recipient._id,
      amount: transferWalletDto.amount,
      type: 'credit',
      category: 'payment',
      description: `Transfer from ${user.fullname}`,
      reference: `${reference}_CREDIT`,
      status: 'completed',
      payment_method: 'wallet',
    });

    await Promise.all([debitTransaction.save(), creditTransaction.save()]);

    // Update wallet balances
    senderWallet.balance -= transferWalletDto.amount;
    recipientWallet.balance += transferWalletDto.amount;

    await Promise.all([senderWallet.save(), recipientWallet.save()]);

    return {
      status: 'success',
      message: 'Transfer completed',
      data: {
        debit_transaction: debitTransaction,
        credit_transaction: creditTransaction,
      },
    };
  }

  async getAllTransactions(params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;
    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = { is_deleted: false };

    if (rest.type) query.type = rest.type;
    if (rest.category) query.category = rest.category;
    if (rest.status) query.status = rest.status;

    if (rest.start_date || rest.end_date) {
      query.createdAt = {};
      if (rest.start_date) query.createdAt.$gte = new Date(rest.start_date);
      if (rest.end_date) query.createdAt.$lte = new Date(rest.end_date);
    }

    const transactions = await this.transactionModel
      .find(query)
      .populate('wallet', ['balance', 'ledger_balance'])
      .populate('user', ['fullname', 'email'])
      .populate('booking')
      .populate('insurance', ['name'])
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.transactionModel.countDocuments(query).exec();

    return {
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      transactions,
    };
  }

  async settleTransaction(id: string) {
    const transaction = await this.getTransactionById(id);

    if (transaction.status !== 'pending') {
      throw new BadRequestException('Transaction is not pending');
    }

    transaction.status = 'completed';
    transaction.processed_at = new Date();
    await transaction.save();

    return {
      status: 'success',
      message: 'Transaction settled',
      data: { transaction },
    };
  }

  async refundTransaction(id: string) {
    const transaction = await this.getTransactionById(id);

    if (transaction.status !== 'completed') {
      throw new BadRequestException('Transaction is not completed');
    }

    // Create refund transaction
    const refundTransaction = new this.transactionModel({
      wallet: transaction.wallet,
      user: transaction.user,
      amount: transaction.amount,
      type: transaction.type === 'credit' ? 'debit' : 'credit',
      category: 'refund',
      description: `Refund for transaction ${transaction.reference}`,
      reference: `REFUND_${transaction.reference}`,
      status: 'completed',
      payment_method: 'wallet',
    });

    await refundTransaction.save();

    // Update wallet balance
    const wallet = await this.walletModel.findById(transaction.wallet);
    if (transaction.type === 'credit') {
      wallet.balance -= transaction.amount;
    } else {
      wallet.balance += transaction.amount;
    }
    await wallet.save();

    return {
      status: 'success',
      message: 'Transaction refunded',
      data: { refund_transaction: refundTransaction },
    };
  }
}
