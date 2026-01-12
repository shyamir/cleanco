import { Global, Module } from '@nestjs/common';
import { BookingLockService } from './booking-lock.service';
import { SlotHoldService } from './slot-hold.service';

@Global()
@Module({
  providers: [BookingLockService, SlotHoldService],
  exports: [BookingLockService, SlotHoldService],
})
export class CommonServicesModule {}
