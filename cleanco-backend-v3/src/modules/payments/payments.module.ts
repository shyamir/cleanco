import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BmlModule } from '../bml/bml.module';
import { CheckoutModule } from '../checkout/checkout.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => SubscriptionsModule),
    BmlModule,
    CheckoutModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
