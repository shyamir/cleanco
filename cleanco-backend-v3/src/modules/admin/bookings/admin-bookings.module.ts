import { Module, forwardRef } from '@nestjs/common';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { BookingsModule } from '../../bookings/bookings.module';
import { CleanerAssignmentModule } from '../../cleaner-assignment/cleaner-assignment.module';
import { ServicesModule } from '../../services/services.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BookingsModule),
    CleanerAssignmentModule,
    ServicesModule,
  ],
  controllers: [AdminBookingsController],
  providers: [AdminBookingsService],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}
