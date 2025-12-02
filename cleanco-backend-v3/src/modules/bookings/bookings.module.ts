import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CleanerAssignmentModule } from '../cleaner-assignment/cleaner-assignment.module';

@Module({
  imports: [PrismaModule, CleanerAssignmentModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
