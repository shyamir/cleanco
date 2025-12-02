# TODO: Scheduled Token Cleanup

## Problem
Expired refresh tokens accumulate in the database over time. While revoked tokens are marked with `isRevoked: true`, they remain in the database indefinitely.

## Recommended Solution
Use NestJS scheduled tasks (`@nestjs/schedule`) to automatically delete expired tokens.

## Implementation Steps

### 1. Install the schedule package
```bash
npm install @nestjs/schedule
```

### 2. Add ScheduleModule to AppModule
```typescript
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... other imports
  ],
})
export class AppModule {}
```

### 3. Create TokenCleanupService
```typescript
// src/modules/auth/token-cleanup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Runs every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    this.logger.log(`Cleaned up ${result.count} expired tokens`);
  }
}
```

### 4. Register the service in AuthModule
```typescript
// src/modules/auth/auth.module.ts
import { TokenCleanupService } from './token-cleanup.service';

@Module({
  providers: [
    AuthService,
    TokenCleanupService,
    // ... other providers
  ],
})
export class AuthModule {}
```

## Why This Approach
- Runs automatically without manual intervention
- Deletes ALL expired tokens (both revoked and non-revoked)
- Configurable schedule (daily, hourly, etc.)
- Logs cleanup activity for monitoring
- Native NestJS solution, no external dependencies

## Alternative Schedules
```typescript
@Cron(CronExpression.EVERY_HOUR)           // Every hour
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Daily at midnight
@Cron(CronExpression.EVERY_WEEK)           // Weekly
@Cron('0 0 * * 0')                         // Custom: Every Sunday at midnight
```
