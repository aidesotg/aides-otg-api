import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
@Injectable()
export class FlutterwaveService {
  public baseUrl = 'https://api.flutterwave.com/v3';
  public options = {
    timeout: 1000 * 60,
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
    },
  };

  async initiateTransaction(payload: any) {
    const response = await axios.post(
      `${this.baseUrl}/payments`,
      payload,
      this.options,
    );
    console.log(`Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`);
    return response.data.data.link;
  }

  async verifyTransaction(id) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${id}/verify`,
        this.options,
      );
      console.log('verify ', response.data);
      return response.data;
    } catch (err) {
      throw new BadRequestException({
        status: 'error',
        message: 'Unable to verify transaction',
      });
    }
  }

  async getBankList(code = 'NG') {
    const response = await axios.get(
      `${this.baseUrl}/banks/${code}`,
      this.options,
    );
    console.log('verify ', response.data);
    return response.data.data;
  }

  async verifyBank(payload: any) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/accounts/resolve`,
        payload,
        this.options,
      );
      console.log(`Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`);
      return response.data.data;
    } catch (err) {
      console.log(
        '🚀 ~ FlutterwaveService ~ verifyBank ~ err:',
        err.response.data.message,
      );
      throw new BadRequestException({
        status: 'error',
        message: 'Unable to verify bank details',
      });
    }
  }

  async verifyBVN(bvn: string) {
    const response = await axios.get(
      `${this.baseUrl}/kyc/bvns/${bvn}`,
      this.options,
    );
    console.log('verify ', response.data);
    return response.data;
  }

  async createTransfer(payload: any) {
    const response = await axios.post(
      `${this.baseUrl}/transfers`,
      payload,
      this.options,
    );
    console.log(`Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`);
    return response.data;
  }

  async transferRates(payload: {
    amount: number;
    destination_currency: string;
    source_currency: string;
  }) {
    const { amount, destination_currency, source_currency } = payload;
    try {
      const response = await axios.get(
        `${this.baseUrl}/transfers/rates?amount=${amount}&destination_currency=${destination_currency}&source_currency=${source_currency}`,
        this.options,
      );
      console.log('rates ', response.data);
      return response.data;
    } catch (err) {
      throw err;
    }
  }
}
