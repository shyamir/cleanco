import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MsgOwlService } from '../../integrations/msgowl/msgowl.service';
import { UserRole } from '@prisma/client';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto } from './dto';
import { addDays } from 'date-fns';
import { DateUtils } from '../../common/utils/date.utils';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    phoneNumber: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    role: UserRole;
  };
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly msgOwlService: MsgOwlService,
  ) {}

  /**
   * Send OTP to phone number
   */
  async sendOtp(sendOtpDto: SendOtpDto) {
    const { phoneNumber } = sendOtpDto;

    this.logger.log(`Sending OTP to ${phoneNumber}`);

    // In development or test environment, you can use mock OTP
    const env = this.configService.get('env');
    if (env === 'development' || env === 'test') {
      const useMock = this.configService.get('features.useMockOtp', false);
      if (useMock) {
        return this.msgOwlService.sendOtpMock(phoneNumber);
      }
    }

    return this.msgOwlService.sendOtp(phoneNumber);
  }

  /**
   * Verify OTP and create/login user
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<AuthResponse> {
    const { phoneNumber, code, firstName, lastName, email } = verifyOtpDto;

    this.logger.log(`Verifying OTP for ${phoneNumber}`);

    // Verify OTP with Message Owl
    let verificationResult;

    const env = this.configService.get('env');
    if (env === 'development' || env === 'test') {
      const useMock = this.configService.get('features.useMockOtp', false);
      if (useMock) {
        verificationResult = await this.msgOwlService.verifyOtpMock(
          phoneNumber,
          code,
        );
      } else {
        verificationResult = await this.msgOwlService.verifyOtp(
          phoneNumber,
          code,
        );
      }
    } else {
      verificationResult = await this.msgOwlService.verifyOtp(
        phoneNumber,
        code,
      );
    }

    if (!verificationResult.verified) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });

    let isNewUser = false;

    if (!user) {
      // New user registration - firstName and lastName are now optional
      // They can be set later via profile update
      this.logger.log(`Creating new user for ${phoneNumber}`);

      user = await this.prisma.user.create({
        data: {
          phoneNumber,
          firstName: firstName || null,
          lastName: lastName || null,
          email: email || null,
          role: UserRole.CUSTOMER,
          isActive: true,
        },
      });

      isNewUser = true;
      this.logger.log(`New user created: ${user.id}`);
    } else {
      // Existing user login
      if (!user.isActive) {
        throw new UnauthorizedException('User account is deactivated');
      }

      this.logger.log(`Existing user logging in: ${user.id}`);

      // Optionally update user info if provided
      if (firstName || lastName || email) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(email && { email }),
          },
        });
      }
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.role);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      isNewUser,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    const { refreshToken } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.secret') || 'default-secret',
      });

      // Check if refresh token exists in database and is not revoked
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.isRevoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (DateUtils.nowInMaldives() > storedToken.expiresAt) {
        throw new UnauthorizedException('Refresh token expired');
      }

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.role);

      // Revoke old refresh token
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      // Store new refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      this.logger.error('Refresh token error:', error.message);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout user by revoking refresh token
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });

    this.logger.log(`User ${userId} logged out`);
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    role: UserRole,
  ): Promise<AuthTokens> {
    // Add a unique identifier to ensure token uniqueness
    const tokenId = Math.random().toString(36).substring(2, 15);
    const payload = { userId, role, jti: tokenId };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret') || 'default-secret',
      expiresIn: (this.configService.get<string>('jwt.accessTokenExpiry') || '15m') as any,
    });

    const refreshPayload = { userId, role, jti: Math.random().toString(36).substring(2, 15) };
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
    userId: string,
    token: string,
  ): Promise<void> {
    const expiresAt = addDays(
      DateUtils.nowInMaldives(),
      7, // 7 days - should match JWT_REFRESH_TOKEN_EXPIRY
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  /**
   * Validate user by ID (used by JWT strategy)
   */
  async validateUser(userId: string) {
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
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }
}
