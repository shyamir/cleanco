import { Module } from '@nestjs/common';
import { AdminPromoCodesController } from './admin-promo-codes.controller';
import { AdminPromoCodesService } from './admin-promo-codes.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminPromoCodesController],
  providers: [AdminPromoCodesService],
  exports: [AdminPromoCodesService],
})
export class AdminPromoCodesModule {}
