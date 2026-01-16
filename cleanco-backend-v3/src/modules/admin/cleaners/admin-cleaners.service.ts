import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class AdminCleanersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 100, search } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      user: {
        isActive: true,
        role: 'CLEANER',
      },
    };

    if (search) {
      where.user = {
        ...where.user,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search } },
        ],
      };
    }

    const [cleaners, total] = await Promise.all([
      this.prisma.cleanerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              email: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.cleanerProfile.count({ where }),
    ]);

    return {
      data: cleaners,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAvailable(params: {
    date: string;
    timeSlotId: string;
    excludeBookingId?: string;
  }) {
    const { date, timeSlotId, excludeBookingId } = params;
    const bookingDate = new Date(date);

    // Get all active cleaner profiles with vacation and assignment info
    const cleanerProfiles = await this.prisma.cleanerProfile.findMany({
      where: {
        isAvailable: true,
        user: { isActive: true, role: 'CLEANER' },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        // Check for vacations on this date
        vacations: {
          where: {
            startDate: { lte: bookingDate },
            endDate: { gte: bookingDate },
          },
        },
        // Count existing assignments for this date/time slot
        assignments: {
          where: {
            booking: {
              date: bookingDate,
              timeSlotId: timeSlotId,
              status: { in: ['CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'] },
              // Exclude current booking if reassigning
              ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
            },
          },
        },
      },
    });

    // Filter: not on vacation, not already assigned to another booking at this time slot
    const availableCleaners = cleanerProfiles
      .filter((c) => c.vacations.length === 0)
      .filter((c) => c.assignments.length === 0) // Strict 1:1 - can only be at one place at a time
      .map((c) => ({
        id: c.id,
        name:
          `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() ||
          c.user?.phoneNumber ||
          'Unknown',
        cleanerProfileId: c.id,
      }));

    return { data: availableCleaners };
  }
}
