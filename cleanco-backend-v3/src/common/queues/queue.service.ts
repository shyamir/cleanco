import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, JobsOptions } from 'bullmq';
import {
  QueueName,
  NotificationJob,
  SubscriptionJob,
  ReminderJob,
  PaymentJob,
} from './queue.constants';
import {
  SendSmsJobData,
  SendPushJobData,
  SendEmailJobData,
  BookingNotificationData,
} from './processors/notification.processor';
import {
  ProcessBillingJobData,
  GenerateInvoiceJobData,
  CreateAppointmentsJobData,
  RenewSubscriptionJobData,
} from './processors/subscription.processor';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QueueName.NOTIFICATIONS)
    private notificationsQueue: Queue,
    @InjectQueue(QueueName.SUBSCRIPTION_BILLING)
    private subscriptionQueue: Queue,
    @InjectQueue(QueueName.BOOKING_REMINDERS)
    private remindersQueue: Queue,
    @InjectQueue(QueueName.PAYMENTS)
    private paymentsQueue: Queue,
  ) {}

  // ==================== Notification Jobs ====================

  async sendSms(
    data: SendSmsJobData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.notificationsQueue.add(
      NotificationJob.SEND_SMS,
      data,
      options,
    );
    this.logger.log(`SMS job added: ${job.id}`);
    return job.id!;
  }

  async sendPushNotification(
    data: SendPushJobData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.notificationsQueue.add(
      NotificationJob.SEND_PUSH,
      data,
      options,
    );
    this.logger.log(`Push notification job added: ${job.id}`);
    return job.id!;
  }

  async sendEmail(
    data: SendEmailJobData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.notificationsQueue.add(
      NotificationJob.SEND_EMAIL,
      data,
      options,
    );
    this.logger.log(`Email job added: ${job.id}`);
    return job.id!;
  }

  async sendBookingConfirmation(
    data: BookingNotificationData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.notificationsQueue.add(
      NotificationJob.BOOKING_CONFIRMATION,
      data,
      options,
    );
    this.logger.log(`Booking confirmation job added: ${job.id}`);
    return job.id!;
  }

  async sendBookingReminder(
    data: BookingNotificationData,
    delay?: number,
  ): Promise<string> {
    const job = await this.notificationsQueue.add(
      NotificationJob.BOOKING_REMINDER,
      data,
      {
        delay, // Delay in milliseconds
      },
    );
    this.logger.log(`Booking reminder job added: ${job.id} with delay ${delay}ms`);
    return job.id!;
  }

  async sendBookingCancellation(
    data: BookingNotificationData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.notificationsQueue.add(
      NotificationJob.BOOKING_CANCELLED,
      data,
      options,
    );
    this.logger.log(`Booking cancellation job added: ${job.id}`);
    return job.id!;
  }

  async notifyCleanerAssigned(
    data: BookingNotificationData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.notificationsQueue.add(
      NotificationJob.CLEANER_ASSIGNED,
      data,
      options,
    );
    this.logger.log(`Cleaner assigned notification job added: ${job.id}`);
    return job.id!;
  }

  // ==================== Subscription Jobs ====================

  async processBilling(
    data: ProcessBillingJobData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.subscriptionQueue.add(
      SubscriptionJob.PROCESS_BILLING,
      data,
      options,
    );
    this.logger.log(`Billing processing job added: ${job.id}`);
    return job.id!;
  }

  async generateInvoice(
    data: GenerateInvoiceJobData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.subscriptionQueue.add(
      SubscriptionJob.GENERATE_INVOICE,
      data,
      options,
    );
    this.logger.log(`Invoice generation job added: ${job.id}`);
    return job.id!;
  }

  async createSubscriptionAppointments(
    data: CreateAppointmentsJobData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.subscriptionQueue.add(
      SubscriptionJob.CREATE_APPOINTMENTS,
      data,
      options,
    );
    this.logger.log(`Appointment creation job added: ${job.id}`);
    return job.id!;
  }

  async renewSubscription(
    data: RenewSubscriptionJobData,
    scheduledDate: Date,
  ): Promise<string> {
    const delay = scheduledDate.getTime() - Date.now();
    const job = await this.subscriptionQueue.add(
      SubscriptionJob.RENEW_SUBSCRIPTION,
      data,
      {
        delay: Math.max(0, delay),
      },
    );
    this.logger.log(
      `Subscription renewal job added: ${job.id} scheduled for ${scheduledDate}`,
    );
    return job.id!;
  }

  // ==================== Reminder Jobs ====================

  async scheduleBookingReminder24h(
    bookingId: string,
    userId: string,
    scheduledTime: Date,
  ): Promise<string> {
    const delay = scheduledTime.getTime() - Date.now();
    const job = await this.remindersQueue.add(
      ReminderJob.BOOKING_REMINDER_24H,
      { bookingId, userId },
      {
        delay: Math.max(0, delay),
      },
    );
    this.logger.log(
      `24h booking reminder job added: ${job.id} for ${scheduledTime}`,
    );
    return job.id!;
  }

  async scheduleBookingReminder2h(
    bookingId: string,
    userId: string,
    scheduledTime: Date,
  ): Promise<string> {
    const delay = scheduledTime.getTime() - Date.now();
    const job = await this.remindersQueue.add(
      ReminderJob.BOOKING_REMINDER_2H,
      { bookingId, userId },
      {
        delay: Math.max(0, delay),
      },
    );
    this.logger.log(
      `2h booking reminder job added: ${job.id} for ${scheduledTime}`,
    );
    return job.id!;
  }

  // ==================== Payment Jobs ====================

  async processPayment(
    paymentData: any,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.paymentsQueue.add(
      PaymentJob.PROCESS_PAYMENT,
      paymentData,
      options,
    );
    this.logger.log(`Payment processing job added: ${job.id}`);
    return job.id!;
  }

  async verifyPayment(
    paymentId: string,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.paymentsQueue.add(
      PaymentJob.VERIFY_PAYMENT,
      { paymentId },
      options,
    );
    this.logger.log(`Payment verification job added: ${job.id}`);
    return job.id!;
  }

  // ==================== Utility Methods ====================

  async getJob(queueName: QueueName, jobId: string) {
    const queue = this.getQueueByName(queueName);
    return queue.getJob(jobId);
  }

  async getJobStatus(queueName: QueueName, jobId: string) {
    const job = await this.getJob(queueName, jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress,
      state: await job.getState(),
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  private getQueueByName(queueName: QueueName): Queue {
    switch (queueName) {
      case QueueName.NOTIFICATIONS:
        return this.notificationsQueue;
      case QueueName.SUBSCRIPTION_BILLING:
        return this.subscriptionQueue;
      case QueueName.BOOKING_REMINDERS:
        return this.remindersQueue;
      case QueueName.PAYMENTS:
        return this.paymentsQueue;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }
  }
}
