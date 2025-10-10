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

  async getBankList() {
    const response = await axios.get(`${this.baseUrl}/banks/NG`, this.options);
    console.log('verify ', response.data);
    return response.data.data;
  }

  async verifyBank(payload: any) {
    const response = await axios.post(
      `${this.baseUrl}/accounts/resolve`,
      payload,
      this.options,
    );
    console.log(`Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`);
    return response.data.data;
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
}
