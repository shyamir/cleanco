import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MsgOwlService } from '../../integrations/msgowl/msgowl.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly msgOwlService: MsgOwlService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get all users with pagination and filtering (admin only)
   */
  async findAll(queryDto: QueryUsersDto) {
    const { role, search, phoneNumber, page = 1, limit = 10 } = queryDto;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (phoneNumber) {
      where.phoneNumber = phoneNumber;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phoneNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get user by ID
   */
  async findOne(userId: string, requestingUserId: string, requestingUserRole: UserRole) {
    // Users can only view their own profile unless they are admin
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only view your own profile');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            label: true,
            streetAddress: true,
            city: true,
            isPrimary: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          select: {
            id: true,
            label: true,
            streetAddress: true,
            city: true,
            isPrimary: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async update(
    userId: string,
    updateDto: UpdateUserDto,
    requestingUserId: string,
    requestingUserRole: UserRole,
  ) {
    // Users can only update their own profile unless they are admin
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own profile');
    }

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check if email is already taken by another user
    if (updateDto.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateDto.email,
          NOT: { id: userId },
        },
      });

      if (emailExists) {
        throw new BadRequestException('Email is already taken');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateDto,
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(userId: string, updateRoleDto: UpdateUserRoleDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: updateRoleDto.role },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Soft delete user (admin only)
   */
  async remove(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete by deactivating the user
    const deletedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return {
      message: 'User deactivated successfully',
      user: deletedUser,
    };
  }

  /**
   * Activate user (admin only)
   */
  async activate(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return {
      message: 'User activated successfully',
      user: activatedUser,
    };
  }

  /**
   * Update user phone number with OTP verification
   */
  async updatePhone(userId: string, dto: UpdatePhoneDto) {
    // 1. Verify OTP for new phone number
    let verifyResult;

    const env = this.configService.get('env');
    if (env === 'development' || env === 'test') {
      const useMock = this.configService.get('features.useMockOtp', false);
      if (useMock) {
        verifyResult = await this.msgOwlService.verifyOtpMock(
          dto.newPhoneNumber,
          dto.otp,
        );
      } else {
        verifyResult = await this.msgOwlService.verifyOtp(
          dto.newPhoneNumber,
          dto.otp,
        );
      }
    } else {
      verifyResult = await this.msgOwlService.verifyOtp(
        dto.newPhoneNumber,
        dto.otp,
      );
    }

    if (!verifyResult.verified) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // 2. Check new phone isn't already in use by another user
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.newPhoneNumber },
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException(
        'This phone number is already registered to another account',
      );
    }

    // 3. Update user's phoneNumber
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { phoneNumber: dto.newPhoneNumber },
      select: {
        id: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
