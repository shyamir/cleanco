import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CleanerAssignmentModule } from '../cleaner-assignment/cleaner-assignment.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [CleanerAssignmentModule, ServicesModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
