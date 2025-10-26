import { Injectable, HttpException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateContentDto } from '../dto/update-content.dto';
import { Terms } from '../interface/terms.interface';

@Injectable()
export class TermsService {
  constructor(
    @InjectModel('Terms') private readonly termsModel: Model<Terms>,
  ) {}

  async createTerms(body: any) {
    const { content, type } = body;
    const terms = await this.termsModel.findOne({ type }).exec();
    if (terms) {
      throw new ForbiddenException({
        status: 'error',
        message: `Unable to create new Terms, please update current ${type} Terms instead`,
      });
    }
    const newterms = new this.termsModel({ content, type });

    await newterms.save();
    return {
      status: 'success',
      message: 'Terms and Agreement created',
      data: newterms,
    };
  }

  async getAllTerms(type?: string) {
    const query: any = {};
    if (type) query.type = type;
    const terms = await this.termsModel.find(query).exec();

    return terms;
  }

  async getTerms(type?: string) {
    const query: any = {};
    if (type) query.type = type;
    const terms = await this.termsModel.findOne(query).exec();
    if (!terms) {
      throw new HttpException(
        { status: 'error', message: `${type} not found` },
        404,
      );
    }
    return terms;
  }

  async updateTerms(updateContent: UpdateContentDto) {
    const { id, content, type } = updateContent;
    const terms = await this.termsModel.findOne({ _id: id }).exec();
    if (!terms) {
      throw new HttpException(
        { status: 'error', message: 'Terms and Agreement not found' },
        404,
      );
    }

    terms.content = content;
    await terms.save();
    return {
      status: 'success',
      message: 'Terms and Agreement created',
      data: terms,
    };
  }
}
