import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Admin portal users (SUPER_ADMIN or ADMIN) can access any endpoint requiring ADMIN role
    if (user?.isAdminPortal) {
      const isAdminRequired = requiredRoles.includes(UserRole.ADMIN);
      if (isAdminRequired && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
        return true;
      }
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
