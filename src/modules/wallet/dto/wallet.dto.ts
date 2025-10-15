import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  Min,
  IsEmail,
} from 'class-validator';

export class FundWalletDto {
  @ApiProperty()
  @IsNumber()
  @Min(100, { message: 'Minimum funding amount is 100' })
  amount: number;

  @ApiProperty()
  @IsEnum(['card', 'bank_transfer', 'flutterwave', 'stripe'])
  payment_method: 'card' | 'bank_transfer' | 'flutterwave' | 'stripe';

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class WithdrawWalletDto {
  @ApiProperty()
  @IsNumber()
  @Min(100, { message: 'Minimum withdrawal amount is 100' })
  amount: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_account: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  account_name: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class TransferWalletDto {
  @ApiProperty()
  @IsNumber()
  @Min(1, { message: 'Minimum transfer amount is 1' })
  amount: number;

  @ApiProperty()
  @IsEmail()
  recipient_email: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;
}

export class TransactionQueryDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  type?: 'credit' | 'debit';

  @ApiProperty()
  @IsString()
  @IsOptional()
  category?:
    | 'deposit'
    | 'withdrawal'
    | 'payment'
    | 'refund'
    | 'commission'
    | 'penalty'
    | 'service_fee';

  @ApiProperty()
  @IsString()
  @IsOptional()
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';

  @ApiProperty()
  @IsString()
  @IsOptional()
  start_date?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  end_date?: string;
}
