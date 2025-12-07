import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all active zones, ordered by orderIndex
   */
  async findAll() {
    return this.prisma.zone.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
