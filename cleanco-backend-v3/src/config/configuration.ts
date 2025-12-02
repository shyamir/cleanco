export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  },

  msgOwl: {
    apiKey: process.env.MSGOWL_API_KEY,
    baseUrl: process.env.MSGOWL_BASE_URL || 'https://api.msgowl.com/v1',
    senderId: process.env.MSGOWL_SENDER_ID || 'Cleanco',
  },

  bml: {
    merchantId: process.env.BML_MERCHANT_ID,
    secretKey: process.env.BML_SECRET_KEY,
    baseUrl: process.env.BML_BASE_URL || 'https://api.bankofmaldives.com',
    redirectUrl: process.env.BML_REDIRECT_URL,
    webhookUrl: process.env.BML_WEBHOOK_URL,
  },

  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    storageBucket: process.env.GCP_STORAGE_BUCKET,
    credentialsPath: process.env.GCP_CREDENTIALS_PATH,
  },

  fcm: {
    serverKey: process.env.FCM_SERVER_KEY,
    projectId: process.env.FCM_PROJECT_ID,
    credentialsPath: process.env.FCM_CREDENTIALS_PATH,
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3001',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:3002',
    cleanerAppUrl: process.env.CLEANER_APP_URL || 'http://localhost:3003',
  },

  features: {
    useMockOtp: process.env.USE_MOCK_OTP === 'true',
    enableAutoAssignment: process.env.ENABLE_AUTO_ASSIGNMENT === 'true',
    enableSameDayBooking: process.env.ENABLE_SAME_DAY_BOOKING === 'true',
    enableSubscriptionAutoBilling:
      process.env.ENABLE_SUBSCRIPTION_AUTO_BILLING === 'true',
    maxRescheduleCount: parseInt(process.env.MAX_RESCHEDULE_COUNT || '1', 10),
    minBookingNoticeHours:
      parseInt(process.env.MIN_BOOKING_NOTICE_HOURS || '0', 10),
    cancelDeadlineHours: parseInt(process.env.CANCEL_DEADLINE_HOURS || '24', 10),
  },

  business: {
    cleanersFor1Bedroom: parseInt(process.env.CLEANERS_FOR_1_BEDROOM || '1', 10),
    cleanersFor2Bedroom: parseInt(process.env.CLEANERS_FOR_2_BEDROOM || '1', 10),
    cleanersFor3Bedroom: parseInt(process.env.CLEANERS_FOR_3_BEDROOM || '2', 10),
    cleanersFor4Bedroom: parseInt(process.env.CLEANERS_FOR_4_BEDROOM || '2', 10),
    cleanersFor4BedroomMax:
      parseInt(process.env.CLEANERS_FOR_4_BEDROOM_MAX || '3', 10),
    subscriptionInvoiceDaysBefore:
      parseInt(process.env.SUBSCRIPTION_INVOICE_DAYS_BEFORE || '3', 10),
    subscriptionAppointmentWeeks:
      parseInt(process.env.SUBSCRIPTION_APPOINTMENT_WEEKS || '4', 10),
    bookingReminderHoursBefore:
      parseInt(process.env.BOOKING_REMINDER_HOURS_BEFORE || '24', 10),
  },

  cleaners: {
    for1Bedroom: parseInt(process.env.CLEANERS_FOR_1_BEDROOM || '1', 10),
    for2Bedroom: parseInt(process.env.CLEANERS_FOR_2_BEDROOM || '1', 10),
    for3Bedroom: parseInt(process.env.CLEANERS_FOR_3_BEDROOM || '2', 10),
    for4Bedroom: parseInt(process.env.CLEANERS_FOR_4_BEDROOM || '2', 10),
    for4BedroomMax: parseInt(process.env.CLEANERS_FOR_4_BEDROOM_MAX || '3', 10),
    maxBookingsPerSlot: parseInt(process.env.MAX_BOOKINGS_PER_CLEANER_SLOT || '3', 10),
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  sentry: {
    dsn: process.env.SENTRY_DSN,
  },

  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedFileTypes:
      process.env.ALLOWED_FILE_TYPES?.split(',') || [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ],
  },
});
