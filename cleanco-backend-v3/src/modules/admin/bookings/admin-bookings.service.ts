import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AdminBookingsQueryDto } from './dto/admin-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { parse } from 'date-fns';

@Injectable()
export class AdminBookingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all bookings with filtering and pagination
   */
  async findAll(query: AdminBookingsQueryDto) {
    const {
      status,
      serviceType,
      userId,
      dateFrom,
      dateTo,
      bookingNumber,
      page = 1,
      limit = 20,
    } = query;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (userId) {
      where.userId = userId;
    }

    if (bookingNumber) {
      where.bookingNumber = {
        contains: bookingNumber,
        mode: 'insensitive',
      };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = parse(dateFrom, 'yyyy-MM-dd', new Date());
      }
      if (dateTo) {
        where.date.lte = parse(dateTo, 'yyyy-MM-dd', new Date());
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get bookings and total count
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              email: true,
            },
          },
          address: true,
          timeSlot: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single booking by ID (admin can see any booking)
   */
  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        address: true,
        timeSlot: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  /**
   * Update booking status
   */
  async updateStatus(id: string, updateStatusDto: UpdateBookingStatusDto) {
    const { status, notes } = updateStatusDto;

    // Check if booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Validate status transitions
    if (booking.status === 'CANCELED' && status !== 'CANCELED') {
      throw new BadRequestException('Cannot change status of canceled booking');
    }

    if (booking.status === 'COMPLETED' && status !== 'COMPLETED') {
      throw new BadRequestException('Cannot change status of completed booking');
    }

    // Update booking status
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status,
        adminApproved: status === 'CONFIRMED' ? true : booking.adminApproved,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        address: true,
        timeSlot: true,
      },
    });

    return {
      message: `Booking status updated to ${status}`,
      booking: updatedBooking,
    };
  }

  /**
   * Delete a booking (admin force delete)
   */
  async remove(id: string) {
    // Check if booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Delete the booking
    await this.prisma.booking.delete({
      where: { id },
    });

    return {
      message: 'Booking deleted successfully',
      bookingNumber: booking.bookingNumber,
    };
  }

  /**
   * Get booking statistics
   */
  async getStatistics() {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      canceledBookings,
    ] = await Promise.all([
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { status: 'CANCELED' } }),
    ]);

    return {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      canceled: canceledBookings,
    };
  }
}
