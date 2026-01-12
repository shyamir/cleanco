import { Global, Module } from '@nestjs/common';
import { BookingLockService } from './booking-lock.service';

@Global()
@Module({
  providers: [BookingLockService],
  exports: [BookingLockService],
})
export class CommonServicesModule {}
