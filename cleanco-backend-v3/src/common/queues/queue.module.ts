import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueName } from './queue.constants';
import { QueueService } from './queue.service';
import { NotificationProcessor } from './processors/notification.processor';
import { SubscriptionProcessor } from './processors/subscription.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            age: 24 * 3600, // Keep completed jobs for 24 hours
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Keep failed jobs for 7 days
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Register all queues
    BullModule.registerQueue(
      { name: QueueName.NOTIFICATIONS },
      { name: QueueName.SUBSCRIPTION_BILLING },
      { name: QueueName.BOOKING_REMINDERS },
      { name: QueueName.EMAIL },
      { name: QueueName.SMS },
      { name: QueueName.PUSH_NOTIFICATIONS },
      { name: QueueName.PAYMENTS },
    ),
  ],
  providers: [QueueService, NotificationProcessor, SubscriptionProcessor],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
