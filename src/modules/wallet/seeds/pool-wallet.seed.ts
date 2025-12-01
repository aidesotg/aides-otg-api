import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Seeder } from 'nestjs-seeder';
import { PoolWallet } from '../interface/pool-wallet.interface';
@Injectable()
export class PoolWalletSeeder implements Seeder {
  constructor(
    @InjectModel('PoolWallet') private poolWalletModel: Model<PoolWallet>,
    private configService: ConfigService,
  ) {}
  async seed(): Promise<any> {
    //get the user email from the env and password
    // create the user

    const poolWallet = await this.poolWalletModel.findOne();
    if (!poolWallet) {
      const newPoolWallet = new this.poolWalletModel({
        balance: 0,
        ledger_balance: 0,
      });
      await newPoolWallet.save();
    }

    return;
  }

  async drop(): Promise<any> {
    this.poolWalletModel.deleteOne();
  }
}
