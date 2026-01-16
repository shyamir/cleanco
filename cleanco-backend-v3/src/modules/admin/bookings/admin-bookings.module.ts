import { Module, forwardRef } from '@nestjs/common';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { BookingsModule } from '../../bookings/bookings.module';

@Module({
  imports: [PrismaModule, forwardRef(() => BookingsModule)],
  controllers: [AdminBookingsController],
  providers: [AdminBookingsService],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}
