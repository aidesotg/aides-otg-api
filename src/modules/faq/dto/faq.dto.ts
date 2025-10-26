/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
// eslint-disable-next-line prettier/prettier
import {
  IsString,
} from 'class-validator';

export class CreateFaqDto {
    @ApiProperty()
    @IsString()
    question: string;

    @ApiProperty()
    @IsString()
    answer: string;
}

