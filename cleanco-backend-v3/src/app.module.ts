import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { CommonServicesModule } from './common/services/services.module';
import { QueueModule } from './common/queues/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { ServicesModule } from './modules/services/services.module';
import { AdminServicesModule } from './modules/admin/services/admin-services.module';
import { AdminBookingsModule } from './modules/admin/bookings/admin-bookings.module';
import { TimeSlotsModule } from './modules/time-slots/time-slots.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CleanerAssignmentModule } from './modules/cleaner-assignment/cleaner-assignment.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { AdminSubscriptionsModule } from './modules/admin/subscriptions/admin-subscriptions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminPaymentsModule } from './modules/admin/payments/admin-payments.module';
import { ZonesModule } from './modules/zones/zones.module';
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Scheduling for cron jobs
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Common services (booking locks, slot holds, etc.)
    CommonServicesModule,

    // Queue system for background jobs
    QueueModule,

    // Feature modules
    AuthModule,
    UsersModule,
    AddressesModule,
    ServicesModule,
    AdminServicesModule,
    AdminBookingsModule,
    TimeSlotsModule,
    BookingsModule,
    CleanerAssignmentModule,
    SubscriptionsModule,
    AdminSubscriptionsModule,
    PaymentsModule,
    AdminPaymentsModule,
    ZonesModule,
    PromoCodesModule,
    SettingsModule,
    CheckoutModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JWT guard globally to all routes
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply roles guard globally
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
