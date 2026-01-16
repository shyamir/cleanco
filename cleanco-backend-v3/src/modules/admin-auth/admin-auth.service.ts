import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminLoginDto, AdminRefreshTokenDto } from './dto';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { addDays } from 'date-fns';

export interface AdminAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AdminAuthResponse extends AdminAuthTokens {
  admin: {
    id: string;
    username: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    role: AdminRole;
  };
}

@Injectable()
export class AdminAuthService {
  private readonly logger = new Logger(AdminAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Admin login with username and password
   */
  async login(loginDto: AdminLoginDto): Promise<AdminAuthResponse> {
    const { username, password } = loginDto;

    this.logger.log(`Admin login attempt for: ${username}`);

    // Find admin by username
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      this.logger.warn(`Admin not found: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      this.logger.warn(`Admin account deactivated: ${username}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Invalid password for admin: ${username}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(admin.id, admin.role);

    // Store refresh token
    await this.storeRefreshToken(admin.id, tokens.refreshToken);

    // Update last login time
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    this.logger.log(`Admin logged in successfully: ${username}`);

    return {
      ...tokens,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenDto: AdminRefreshTokenDto): Promise<AdminAuthTokens> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.secret') || 'default-secret',
      });

      // Check if it's an admin token
      if (!payload.adminId) {
        throw new UnauthorizedException('Invalid admin refresh token');
      }

      // Check if refresh token exists in database and is not revoked
      const storedToken = await this.prisma.adminRefreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.isRevoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get admin
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.adminId },
      });

      if (!admin || !admin.isActive) {
        throw new UnauthorizedException('Admin not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(admin.id, admin.role);

      // Revoke old refresh token
      await this.prisma.adminRefreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      // Store new refresh token
      await this.storeRefreshToken(admin.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      this.logger.error('Admin refresh token error:', error.message);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout admin by revoking refresh token
   */
  async logout(adminId: string, refreshToken: string): Promise<void> {
    await this.prisma.adminRefreshToken.updateMany({
      where: {
        adminId,
        token: refreshToken,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    this.logger.log(`Admin ${adminId} logged out`);
  }

  /**
   * Generate access and refresh tokens for admin
   */
  private async generateTokens(
    adminId: string,
    role: AdminRole,
  ): Promise<AdminAuthTokens> {
    const tokenId = Math.random().toString(36).substring(2, 15);

    // Include adminId and isAdminPortal flag to distinguish from regular user tokens
    const payload = {
      adminId,
      role,
      jti: tokenId,
      isAdminPortal: true,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret') || 'default-secret',
      expiresIn: (this.configService.get<string>('jwt.accessTokenExpiry') || '15m') as any,
    });

    const refreshPayload = {
      adminId,
      role,
      jti: Math.random().toString(36).substring(2, 15),
      isAdminPortal: true,
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get<string>('jwt.secret') || 'default-secret',
      expiresIn: (this.configService.get<string>('jwt.refreshTokenExpiry') || '7d') as any,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    adminId: string,
    token: string,
  ): Promise<void> {
    const expiresAt = addDays(new Date(), 7);

    await this.prisma.adminRefreshToken.create({
      data: {
        adminId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Validate admin by ID (used by JWT strategy)
   */
  async validateAdmin(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin not found or inactive');
    }

    return admin;
  }
}
