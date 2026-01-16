import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface JwtPayload {
  userId?: string;
  adminId?: string;
  role: string;
  isAdminPortal?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') || 'default-secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Check if this is an admin portal token
    if (payload.isAdminPortal && payload.adminId) {
      const admin = await this.prisma.admin.findUnique({
        where: { id: payload.adminId },
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

      // Return admin info in a format compatible with existing guards
      return {
        id: admin.id,
        adminId: admin.id,
        username: admin.username,
        role: admin.role, // Preserve actual role (SUPER_ADMIN or ADMIN)
        isAdminPortal: true,
      };
    }

    // Regular user token (mobile app)
    if (payload.userId) {
      const user = await this.authService.validateUser(payload.userId);

      if (!user) {
        throw new UnauthorizedException();
      }

      return {
        id: user.id,
        userId: user.id,
        phoneNumber: user.phoneNumber,
        role: user.role,
      };
    }

    throw new UnauthorizedException('Invalid token');
  }
}
