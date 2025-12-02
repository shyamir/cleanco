import { IsUUID, IsNotEmpty } from 'class-validator';

export class InitiateSubscriptionBmlPaymentDto {
  @IsUUID()
  @IsNotEmpty()
  subscriptionId: string;
}
