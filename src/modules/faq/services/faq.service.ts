import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Faq } from '../interface/faq.interface';
import { CreateFaqDto } from '../dto/faq.dto';
import { MiscCLass } from 'src/services/misc.service';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel('Faq') private faqModel: Model<Faq>,
    private miscService: MiscCLass,
  ) {}

  async create(faqDto: CreateFaqDto) {
    const newFaq = new this.faqModel(faqDto);
    await newFaq.save();

    return {
      status: 'success',
      message: 'FAQ created successfully',
      data: newFaq,
    };
  }

  async update(id: string, body: Partial<CreateFaqDto>) {
    const faq = await this.faqModel.findOne({ _id: id });

    if (!faq) {
      throw new NotFoundException({
        status: 'error',
        message: 'FAQ not found',
      });
    }

    for (const value in body) {
      faq[value] = body[value];
    }

    await faq.save();

    return {
      status: 'success',
      message: 'FAQ updated successfully',
      data: faq,
    };
  }

  async getFaqs(params: any) {
    const { page = 1, pageSize = 50, ...rest } = params;

    const pagination = await this.miscService.paginate({ page, pageSize });

    const query: any = await this.miscService.search(rest);

    const faqs = await this.faqModel
      .find(query)
      .skip(pagination.offset)
      .limit(pagination.limit)
      .sort({ createdAt: -1 })
      .exec();

    const count = await this.faqModel.countDocuments(query).exec();

    return {
      status: 'success',
      pagination: {
        ...(await this.miscService.pageCount({ count, page, pageSize })),
        total: count,
      },
      faqs,
    };
  }

  async getFaq(id: string) {
    const faq = await this.faqModel.findOne({ _id: id });

    if (!faq) {
      throw new NotFoundException({
        status: 'error',
        message: 'FAQ not found',
      });
    }

    return faq;
  }
}
