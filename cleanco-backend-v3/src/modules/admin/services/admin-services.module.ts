import { Module } from '@nestjs/common';
import { AdminServicesController } from './admin-services.controller';
import { AdminServicesService } from './admin-services.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminServicesController],
  providers: [AdminServicesService],
  exports: [AdminServicesService],
})
export class AdminServicesModule {}
