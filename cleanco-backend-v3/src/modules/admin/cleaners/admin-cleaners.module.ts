import { Module } from '@nestjs/common';
import { AdminCleanersController } from './admin-cleaners.controller';
import { AdminCleanersService } from './admin-cleaners.service';

@Module({
  controllers: [AdminCleanersController],
  providers: [AdminCleanersService],
  exports: [AdminCleanersService],
})
export class AdminCleanersModule {}
