import { Module } from '@nestjs/common';
import { CleanerAssignmentService } from './cleaner-assignment.service';
import { CleanerAssignmentController } from './cleaner-assignment.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CleanerAssignmentController],
  providers: [CleanerAssignmentService],
  exports: [CleanerAssignmentService],
})
export class CleanerAssignmentModule {}
