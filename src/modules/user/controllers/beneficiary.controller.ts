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
import { UserService } from '../services/user.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser } from 'src/framework/decorators/user.decorator';
import { ExceptionsLoggerFilter } from 'src/framework/exceptions/exceptionLogger.filter';
import {
  CreateBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '../dto/beneficiary.dto';
import { BeneficiaryService } from '../services/beneficiary.service';

@ApiTags('user/beneficiaries')
@Controller('user/beneficiaries')
export class BeneficiaryController {
  constructor(private readonly service: BeneficiaryService) {}

  @Post('')
  @UseGuards(AuthGuard('jwt'))
  async createBeneficiaries(
    @Body() body: CreateBeneficiaryDto[],
    @AuthUser() user: any,
  ) {
    return this.service.createBeneficiary(body, user);
  }
  @Put('/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateBeneficiary(
    @Body() body: UpdateBeneficiaryDto,
    @Param('id') id: string,
    @AuthUser() user: any,
  ) {
    return this.service.updateBeneficiary(id, body, user);
  }

  @Get('/all')
  @UseGuards(AuthGuard('jwt'))
  async getAllBeneficiaries(@AuthUser() user: any, @Query() params: any) {
    return this.service.getBeneficiaries(params);
  }

  @Get('')
  @UseGuards(AuthGuard('jwt'))
  async getBeneficiaries(@AuthUser() user: any) {
    return this.service.getBeneficariesByUserId(user._id);
  }

  @Get('/user/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getBeneficiariesByUserId(@Param('userId') userId: string) {
    return this.service.getBeneficariesByUserId(userId);
  }

  @Get('/:id')
  @UseGuards(AuthGuard('jwt'))
  async getBeneficiaryById(@Param('id') id: string) {
    return this.service.getBeneficaryById(id);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard('jwt'))
  @UseFilters(ExceptionsLoggerFilter)
  async deleteBeneficiary(@Param('id') id: string, @AuthUser() user: any) {
    return this.service.deleteBeneficiary(id, user);
  }
}
