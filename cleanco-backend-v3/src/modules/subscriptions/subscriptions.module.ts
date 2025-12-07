import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CleanerAssignmentModule } from '../cleaner-assignment/cleaner-assignment.module';

@Module({
  imports: [PrismaModule, CleanerAssignmentModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
