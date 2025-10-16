import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AwsService } from './aws.service';
import { PresignUrlDto } from './dto/presign-url.dto';
import { MiscCLass } from './misc.service';

@Controller('services')
export class ServicesController {
  constructor(private awsService: AwsService, private miscService: MiscCLass) {}

  @Get('file/presign-url')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(ValidationPipe)
  async createAnewThread(@Query() file: PresignUrlDto) {
    return this.awsService.signUrl(file);
  }

  @Get('states')
  @UsePipes(ValidationPipe)
  async getStates() {
    return this.miscService.getStates();
  }
}
