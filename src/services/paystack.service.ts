import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
@Injectable()
export class PaystackService {
  public baseUrl = 'https://api.paystack.co';
  public options = {
    timeout: 1000 * 60,
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  };

  async initiateTransaction(payload: any) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        payload,
        this.options,
      );
      return response.data.data;
    } catch (err) {
      console.log(
        '🚀 ~ file: paystack.service.ts:25 ~ PaystackService ~ initiateTransaction ~ err:',
        err.response.data,
      );
      throw new HttpException(
        { status: 'error', message: err.response.data.message },
        err.response.status,
      );
    }
  }

  async verifyTransaction(id) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${id}`,
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
    const response = await axios.get(
      `${this.baseUrl}/bank?country=nigeria`,
      this.options,
    );
    console.log('verify ', response.data);
    return response.data.data;
  }

  async verifyBank(payload: any) {
    const response = await axios.post(
      `${this.baseUrl}/accounts/resolve`,
      payload,
      this.options,
    );
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
    return response.data;
  }
}
