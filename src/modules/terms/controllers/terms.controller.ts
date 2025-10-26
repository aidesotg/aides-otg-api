import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { UpdateContentDto } from '../dto/update-content.dto';
import { TermsService } from '../services/terms.service';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get('/')
  async getTerms() {
    const terms = await this.termsService.getAllTerms();
    return {
      status: 'success',
      message: 'Terms fetched',
      data: terms,
    };
  }

  @Get('/:type')
  async getTypeTerms(@Param('type') type: string) {
    const terms = await this.termsService.getTerms(type);
    return {
      status: 'success',
      message: `${type} fetched`,
      data: terms,
    };
  }

  @Post('/create')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createTerms(@Body() body: Partial<UpdateContentDto>) {
    return this.termsService.createTerms(body);
  }

  @Put('/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateTerms(@Body() body: UpdateContentDto) {
    return this.termsService.updateTerms(body);
  }

  @Put('/:type/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateTypeTerms(
    @Body() body: UpdateContentDto,
    @Param('type') type: string,
  ) {
    return this.termsService.updateTerms({ ...body, type });
  }
}
