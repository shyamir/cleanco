import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum BmlTransactionState {
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export class CreateBmlTransactionDto {
  @IsNumber()
  amount: number; // Amount in cents (e.g., 10000 for 100.00 MVR)

  @IsString()
  currency: string; // ISO 4217 code, e.g., "MVR"

  @IsString()
  localId: string; // Internal payment ID

  @IsString()
  @IsOptional()
  customerReference?: string; // Customer-visible reference
}

export class BmlTransactionResponseDto {
  transactionId: string;
  state: string;
  url: string; // Payment URL to redirect user
  created: string;
  amount: number;
  currency: string;
  localId?: string;
  customerReference?: string;
}

export class BmlCallbackQueryDto {
  @IsString()
  transactionId: string;

  @IsEnum(BmlTransactionState)
  state: BmlTransactionState;

  @IsString()
  signature: string;
}

export class BmlWebhookDto {
  transactionId: string;
  state: string;
  signature: string;
  amount?: number;
  currency?: string;
  localId?: string;
  customerReference?: string;
  provider?: string;
  created?: string;
}
