/**
 * Queue names used throughout the application
 */
export enum QueueName {
  NOTIFICATIONS = 'notifications',
  SUBSCRIPTION_BILLING = 'subscription-billing',
  BOOKING_REMINDERS = 'booking-reminders',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH_NOTIFICATIONS = 'push-notifications',
  PAYMENTS = 'payments',
}

/**
 * Job names for the notifications queue
 */
export enum NotificationJob {
  SEND_SMS = 'send-sms',
  SEND_PUSH = 'send-push',
  SEND_EMAIL = 'send-email',
  BOOKING_CONFIRMATION = 'booking-confirmation',
  BOOKING_REMINDER = 'booking-reminder',
  BOOKING_CANCELLED = 'booking-cancelled',
  CLEANER_ASSIGNED = 'cleaner-assigned',
}

/**
 * Job names for the subscription billing queue
 */
export enum SubscriptionJob {
  PROCESS_BILLING = 'process-billing',
  GENERATE_INVOICE = 'generate-invoice',
  SEND_INVOICE = 'send-invoice',
  CREATE_APPOINTMENTS = 'create-appointments',
  RENEW_SUBSCRIPTION = 'renew-subscription',
}

/**
 * Job names for the booking reminders queue
 */
export enum ReminderJob {
  BOOKING_REMINDER_24H = 'booking-reminder-24h',
  BOOKING_REMINDER_2H = 'booking-reminder-2h',
  PAYMENT_DUE_REMINDER = 'payment-due-reminder',
  SUBSCRIPTION_EXPIRY_REMINDER = 'subscription-expiry-reminder',
}

/**
 * Job names for the payment queue
 */
export enum PaymentJob {
  PROCESS_PAYMENT = 'process-payment',
  VERIFY_PAYMENT = 'verify-payment',
  REFUND_PAYMENT = 'refund-payment',
  UPDATE_PAYMENT_STATUS = 'update-payment-status',
}
