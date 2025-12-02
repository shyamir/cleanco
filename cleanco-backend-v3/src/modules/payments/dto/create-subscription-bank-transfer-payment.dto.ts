import { IsUUID, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateSubscriptionBankTransferPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  subscriptionId: string;

  @IsUrl()
  @IsNotEmpty()
  receiptUrl: string;
}
