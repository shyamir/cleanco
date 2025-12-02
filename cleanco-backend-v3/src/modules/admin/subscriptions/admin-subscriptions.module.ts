import { Module } from '@nestjs/common';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { SubscriptionsModule } from '../../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [AdminSubscriptionsController],
})
export class AdminSubscriptionsModule {}
