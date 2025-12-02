import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new address for the authenticated user
   */
  async create(userId: string, createDto: CreateAddressDto) {
    // Check if this is the first address for the user
    const existingAddresses = await this.prisma.address.count({
      where: { userId },
    });

    // If this is the first address, make it primary by default
    const isPrimary = existingAddresses === 0;

    const address = await this.prisma.address.create({
      data: {
        ...createDto,
        userId,
        isPrimary,
      },
    });

    return address;
  }

  /**
   * Get all addresses for the authenticated user
   */
  async findAll(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses;
  }

  /**
   * Get a specific address by ID
   */
  async findOne(addressId: string, userId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // Verify the address belongs to the user
    if (address.userId !== userId) {
      throw new ForbiddenException('You can only access your own addresses');
    }

    return address;
  }

  /**
   * Update an address
   */
  async update(addressId: string, userId: string, updateDto: UpdateAddressDto) {
    // First verify the address exists and belongs to the user
    await this.findOne(addressId, userId);

    const updatedAddress = await this.prisma.address.update({
      where: { id: addressId },
      data: updateDto,
    });

    return updatedAddress;
  }

  /**
   * Set an address as primary (default)
   */
  async setPrimary(addressId: string, userId: string) {
    // Verify the address exists and belongs to the user
    await this.findOne(addressId, userId);

    // Use a transaction to ensure consistency
    await this.prisma.$transaction(async (tx) => {
      // Set all other addresses for this user to non-primary
      await tx.address.updateMany({
        where: {
          userId,
          NOT: { id: addressId },
        },
        data: { isPrimary: false },
      });

      // Set the selected address as primary
      await tx.address.update({
        where: { id: addressId },
        data: { isPrimary: true },
      });
    });

    return this.findOne(addressId, userId);
  }

  /**
   * Delete an address
   */
  async remove(addressId: string, userId: string) {
    // Verify the address exists and belongs to the user
    const address = await this.findOne(addressId, userId);

    // If this is the primary address, check if there are other addresses
    if (address.isPrimary) {
      const otherAddresses = await this.prisma.address.findMany({
        where: {
          userId,
          NOT: { id: addressId },
        },
        orderBy: { createdAt: 'desc' },
      });

      // If there are other addresses, make the most recent one primary
      if (otherAddresses.length > 0) {
        await this.prisma.address.update({
          where: { id: otherAddresses[0].id },
          data: { isPrimary: true },
        });
      }
    }

    // Delete the address
    await this.prisma.address.delete({
      where: { id: addressId },
    });

    return {
      message: 'Address deleted successfully',
    };
  }
}
