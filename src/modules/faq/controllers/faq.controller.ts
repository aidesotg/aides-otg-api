import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseFilters,
  Param,
  Query,
  Put,
  Get,
  Delete,
} from '@nestjs/common';
import { FaqService } from '../services/faq.service';
import { CreateFaqDto } from '../dto/faq.dto';
import { AuthGuard } from '@nestjs/passport';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('faq')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  /*
  Create faq 
  Method: POST
  Route: api/v1/faqs
  */
  @Post('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  createFaq(@Body() createFaqDto: CreateFaqDto) {
    return this.faqService.create(createFaqDto);
  }

  /*
  Get faqs
  Method: GET
  Route: api/v1/faqs
  */
  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getFaqs(@Query() query: any) {
    return this.faqService.getFaqs(query);
  }

  /*
  Get faq
  Method: GET
  Route: api/v1/faqs/:faqId
  */
  @Get('/:faqId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async getFaq(@Param('faqId') faqId: string) {
    const faq = await this.faqService.getFaq(faqId);
    return {
      status: 'success',
      message: 'FAQ fetched successfully',
      data: faq,
    };
  }

  @Put('/:faqId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async update(
    @Param('faqId') faqId: string,
    @Body() createFaqDto: Partial<CreateFaqDto>,
  ) {
    return this.faqService.update(faqId, createFaqDto);
  }
  @Delete('/:faqId')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteFaq(@Param('faqId') faqId: string) {
    return this.faqService.deleteFaq(faqId);
  }
}
