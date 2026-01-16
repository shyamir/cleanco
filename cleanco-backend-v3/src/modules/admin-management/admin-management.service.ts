import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAdminDto, UpdateAdminDto, ResetPasswordDto } from './dto';
import { Admin, AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type AdminPublic = Omit<Admin, 'passwordHash'>;

@Injectable()
export class AdminManagementService {
  private readonly logger = new Logger(AdminManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all admins with pagination
   */
  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: AdminPublic[]; total: number; page: number; limit: number }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where = params?.search
      ? {
          OR: [
            { username: { contains: params.search, mode: 'insensitive' as const } },
            { firstName: { contains: params.search, mode: 'insensitive' as const } },
            { lastName: { contains: params.search, mode: 'insensitive' as const } },
            { email: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [admins, total] = await Promise.all([
      this.prisma.admin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          createdBy: true,
        },
      }),
      this.prisma.admin.count({ where }),
    ]);

    return {
      data: admins as AdminPublic[],
      total,
      page,
      limit,
    };
  }

  /**
   * Get admin by ID
   */
  async findById(id: string): Promise<AdminPublic> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        createdBy: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return admin as AdminPublic;
  }

  /**
   * Create a new admin (SUPER_ADMIN only)
   */
  async create(createAdminDto: CreateAdminDto, creatorId: string): Promise<AdminPublic> {
    const { username, password, email, firstName, lastName } = createAdminDto;

    // Check if username already exists
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await this.prisma.admin.create({
      data: {
        username,
        passwordHash,
        email,
        firstName,
        lastName,
        role: AdminRole.ADMIN, // Can only create regular admins
        createdBy: creatorId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        createdBy: true,
      },
    });

    this.logger.log(`Admin created: ${username} by ${creatorId}`);

    return admin as AdminPublic;
  }

  /**
   * Update an admin
   */
  async update(id: string, updateAdminDto: UpdateAdminDto, currentAdminId: string): Promise<AdminPublic> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Cannot deactivate yourself
    if (id === currentAdminId && updateAdminDto.isActive === false) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    // Cannot modify a SUPER_ADMIN unless you are that SUPER_ADMIN
    if (admin.role === AdminRole.SUPER_ADMIN && id !== currentAdminId) {
      throw new ForbiddenException('Cannot modify another super admin');
    }

    const updatedAdmin = await this.prisma.admin.update({
      where: { id },
      data: updateAdminDto,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        createdBy: true,
      },
    });

    this.logger.log(`Admin updated: ${id}`);

    return updatedAdmin as AdminPublic;
  }

  /**
   * Reset admin password
   */
  async resetPassword(id: string, resetPasswordDto: ResetPasswordDto, currentAdminId: string): Promise<void> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Cannot reset password for a SUPER_ADMIN unless you are that SUPER_ADMIN
    if (admin.role === AdminRole.SUPER_ADMIN && id !== currentAdminId) {
      throw new ForbiddenException('Cannot reset password for another super admin');
    }

    // Generate new password or use provided one
    const newPassword = resetPasswordDto.newPassword || this.generateRandomPassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.admin.update({
      where: { id },
      data: { passwordHash },
    });

    this.logger.log(`Password reset for admin: ${id}`);
  }

  /**
   * Deactivate an admin (soft delete)
   */
  async deactivate(id: string, currentAdminId: string): Promise<void> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Cannot deactivate yourself
    if (id === currentAdminId) {
      throw new ForbiddenException('Cannot deactivate your own account');
    }

    // Cannot deactivate a SUPER_ADMIN
    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot deactivate a super admin');
    }

    await this.prisma.admin.update({
      where: { id },
      data: { isActive: false },
    });

    // Revoke all refresh tokens for this admin
    await this.prisma.adminRefreshToken.updateMany({
      where: { adminId: id },
      data: { isRevoked: true },
    });

    this.logger.log(`Admin deactivated: ${id}`);
  }

  /**
   * Reactivate an admin
   */
  async activate(id: string): Promise<AdminPublic> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const updatedAdmin = await this.prisma.admin.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        createdBy: true,
      },
    });

    this.logger.log(`Admin reactivated: ${id}`);

    return updatedAdmin as AdminPublic;
  }

  /**
   * Generate a random password
   */
  private generateRandomPassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
