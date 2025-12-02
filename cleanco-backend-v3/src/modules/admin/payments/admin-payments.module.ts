import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './admin-payments.controller';
import { PaymentsModule } from '../../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [AdminPaymentsController],
})
export class AdminPaymentsModule {}
