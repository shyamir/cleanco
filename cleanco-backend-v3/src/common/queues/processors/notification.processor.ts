import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueName, NotificationJob } from '../queue.constants';

export interface SendSmsJobData {
  phoneNumber: string;
  message: string;
  userId?: string;
}

export interface SendPushJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface SendEmailJobData {
  to: string;
  subject: string;
  body: string;
  userId?: string;
}

export interface BookingNotificationData {
  bookingId: string;
  userId: string;
  type: 'confirmation' | 'reminder' | 'cancellation' | 'cleaner_assigned';
}

@Processor(QueueName.NOTIFICATIONS)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job): Promise<any> {
    this.logger.log(
      `Processing notification job: ${job.name} (ID: ${job.id})`,
    );

    switch (job.name) {
      case NotificationJob.SEND_SMS:
        return this.handleSendSms(job.data as SendSmsJobData);

      case NotificationJob.SEND_PUSH:
        return this.handleSendPush(job.data as SendPushJobData);

      case NotificationJob.SEND_EMAIL:
        return this.handleSendEmail(job.data as SendEmailJobData);

      case NotificationJob.BOOKING_CONFIRMATION:
        return this.handleBookingConfirmation(
          job.data as BookingNotificationData,
        );

      case NotificationJob.BOOKING_REMINDER:
        return this.handleBookingReminder(job.data as BookingNotificationData);

      case NotificationJob.BOOKING_CANCELLED:
        return this.handleBookingCancellation(
          job.data as BookingNotificationData,
        );

      case NotificationJob.CLEANER_ASSIGNED:
        return this.handleCleanerAssigned(job.data as BookingNotificationData);

      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
        return { success: false, error: 'Unknown job type' };
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.id} failed after ${job.attemptsMade} attempts`,
      error.stack,
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    this.logger.error('Worker error:', error.stack);
  }

  private async handleSendSms(data: SendSmsJobData): Promise<any> {
    this.logger.log(`Sending SMS to ${data.phoneNumber}`);

    // TODO: Integrate with SMS service (MsgOwl or similar)
    // For now, just log the action

    return {
      success: true,
      phoneNumber: data.phoneNumber,
      sentAt: new Date(),
    };
  }

  private async handleSendPush(data: SendPushJobData): Promise<any> {
    this.logger.log(`Sending push notification to user ${data.userId}`);

    // TODO: Integrate with FCM
    // For now, just log the action

    return {
      success: true,
      userId: data.userId,
      sentAt: new Date(),
    };
  }

  private async handleSendEmail(data: SendEmailJobData): Promise<any> {
    this.logger.log(`Sending email to ${data.to}`);

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just log the action

    return {
      success: true,
      to: data.to,
      sentAt: new Date(),
    };
  }

  private async handleBookingConfirmation(
    data: BookingNotificationData,
  ): Promise<any> {
    this.logger.log(`Sending booking confirmation for ${data.bookingId}`);

    // TODO: Fetch booking details and send confirmation via SMS/Push/Email

    return {
      success: true,
      bookingId: data.bookingId,
      sentAt: new Date(),
    };
  }

  private async handleBookingReminder(
    data: BookingNotificationData,
  ): Promise<any> {
    this.logger.log(`Sending booking reminder for ${data.bookingId}`);

    // TODO: Fetch booking details and send reminder

    return {
      success: true,
      bookingId: data.bookingId,
      sentAt: new Date(),
    };
  }

  private async handleBookingCancellation(
    data: BookingNotificationData,
  ): Promise<any> {
    this.logger.log(`Sending cancellation notice for ${data.bookingId}`);

    // TODO: Fetch booking details and send cancellation notice

    return {
      success: true,
      bookingId: data.bookingId,
      sentAt: new Date(),
    };
  }

  private async handleCleanerAssigned(
    data: BookingNotificationData,
  ): Promise<any> {
    this.logger.log(`Notifying about cleaner assignment for ${data.bookingId}`);

    // TODO: Fetch booking and cleaner details, send notification

    return {
      success: true,
      bookingId: data.bookingId,
      sentAt: new Date(),
    };
  }
}
