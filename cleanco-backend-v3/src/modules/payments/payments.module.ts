import { Module, forwardRef } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BmlModule } from '../bml/bml.module';

@Module({
  imports: [PrismaModule, forwardRef(() => SubscriptionsModule), BmlModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
