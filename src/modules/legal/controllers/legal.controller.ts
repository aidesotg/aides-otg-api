import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseFilters,
  Query,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LegalService } from 'src/modules/legal/services/legal.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
  SignAgreementDto,
  LegalDocumentQueryDto,
} from 'src/modules/legal/dto/legal.dto';

@ApiTags('legal')
@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get('/documents')
  @UseGuards(AuthGuard('jwt'))
  async getLegalDocuments(
    @Query() params: LegalDocumentQueryDto,
    @AuthUser() user: any,
  ) {
    const documents = await this.legalService.getLegalDocuments(params, user);
    return {
      status: 'success',
      message: 'Legal documents fetched',
      data: documents,
    };
  }

  @Get('/documents/:id')
  @UseGuards(AuthGuard('jwt'))
  async getLegalDocumentById(@Param('id') id: string) {
    const document = await this.legalService.getLegalDocumentById(id);
    return {
      status: 'success',
      message: 'Legal document fetched',
      data: { document },
    };
  }

  @Get('/documents/:id/agreements')
  @UseGuards(AuthGuard('jwt'))
  async getDocumentAgreements(@Param('id') id: string, @Query() params: any) {
    const agreements = await this.legalService.getDocumentAgreements(
      id,
      params,
    );
    return {
      status: 'success',
      message: 'Document agreements fetched',
      data: agreements,
    };
  }

  @Get('/documents/:id/stats')
  @UseGuards(AuthGuard('jwt'))
  async getDocumentStats(@Param('id') id: string) {
    const stats = await this.legalService.getDocumentStats(id);
    return {
      status: 'success',
      message: 'Document statistics fetched',
      data: stats,
    };
  }

  @Get('/user/agreements')
  @UseGuards(AuthGuard('jwt'))
  async getUserAgreements(@AuthUser() user: any) {
    const agreements = await this.legalService.getUserAgreements(user);
    return {
      status: 'success',
      message: 'User agreements fetched',
      data: agreements,
    };
  }

  @Post('/documents/create')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async createLegalDocument(
    @Body() body: CreateLegalDocumentDto,
    @AuthUser() user: any,
  ) {
    return this.legalService.createLegalDocument(body, user);
  }

  @Put('/documents/:id/update')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async updateLegalDocument(
    @Param('id') id: string,
    @Body() body: UpdateLegalDocumentDto,
  ) {
    return this.legalService.updateLegalDocument(id, body);
  }

  @Post('/sign')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async signAgreement(@Body() body: SignAgreementDto, @AuthUser() user: any) {
    return this.legalService.signAgreement(body, user);
  }

  @Put('/documents/:id/activate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async activateDocument(@Param('id') id: string) {
    return this.legalService.activateDocument(id);
  }

  @Put('/documents/:id/deactivate')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deactivateDocument(@Param('id') id: string) {
    return this.legalService.deactivateDocument(id);
  }

  @Delete('/documents/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteDocument(@Param('id') id: string) {
    return this.legalService.deleteDocument(id);
  }
}
