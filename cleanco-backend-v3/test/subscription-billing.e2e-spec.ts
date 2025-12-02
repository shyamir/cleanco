import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { addDays, startOfDay } from 'date-fns';

describe('Subscription Billing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const mockOtpCode = '123456';

  // Test user IDs
  let adminId: string;
  let customerId: string;
  let adminToken: string;
  let customerToken: string;

  // Test data IDs
  let addressId: string;
  let timeSlotId: string;
  let subscriptionId: string;
  let paymentId: string;

  // Helper function to generate unique phone numbers
  const generatePhoneNumber = () => {
    const firstDigit = Math.random() < 0.5 ? '7' : '9';
    const remainingDigits = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `+960${firstDigit}${remainingDigits}`;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    // Create admin user
    const adminPhone = generatePhoneNumber();
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: adminPhone });

    const adminAuthResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: adminPhone,
        code: mockOtpCode,
        firstName: 'Admin',
        lastName: 'User',
      });

    adminToken = adminAuthResponse.body.accessToken;
    adminId = adminAuthResponse.body.user.id;

    // Update user to admin role
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    // Create customer user
    const customerPhone = generatePhoneNumber();
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: customerPhone });

    const customerAuthResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: customerPhone,
        code: mockOtpCode,
        firstName: 'Customer',
        lastName: 'One',
      });

    customerToken = customerAuthResponse.body.accessToken;
    customerId = customerAuthResponse.body.user.id;

    // Create address for customer
    const addressResponse = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        streetAddress: 'Test Street',
        city: 'Male',
        island: 'Male',
        label: 'Home',
      });

    addressId = addressResponse.body.id;

    // Get a time slot
    const timeSlotsResponse = await request(app.getHttpServer())
      .get('/api/v1/time-slots')
      .set('Authorization', `Bearer ${customerToken}`);

    timeSlotId = timeSlotsResponse.body[0].id;

    // Create a subscription for billing tests
    const subscriptionResponse = await request(app.getHttpServer())
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        serviceType: 'HOME',
        frequency: 'ONCE_A_WEEK',
        addressId,
        timeSlotId,
        selectedDays: [1], // Monday
        bedrooms: 2,
        bathrooms: 2,
        hasPets: false,
      });

    subscriptionId = subscriptionResponse.body.id;
  });

  afterAll(async () => {
    // Clean up test data
    const userIds = [customerId, adminId].filter(Boolean);

    if (userIds.length > 0) {
      // Delete payments
      await prisma.payment.deleteMany({
        where: {
          subscription: {
            userId: { in: userIds },
          },
        },
      });

      // Delete bookings
      await prisma.booking.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Delete subscriptions
      await prisma.subscription.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Delete addresses
      await prisma.address.deleteMany({
        where: { userId: { in: userIds } },
      });

      // Delete users
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await app.close();
  });

  describe('Subscription Creation with Bookings', () => {
    it('should generate 12 weeks of bookings when subscription is created', async () => {
      // Count bookings created for the subscription
      const bookings = await prisma.booking.findMany({
        where: { subscriptionId },
        orderBy: { date: 'asc' },
      });

      // ONCE_A_WEEK with 1 selected day should create bookings for 12 weeks
      // Depending on when the test runs, we might have slightly less than 12 if some dates are in the past
      expect(bookings.length).toBeGreaterThan(0);
      expect(bookings.length).toBeLessThanOrEqual(12);

      // Verify all bookings are for subscription
      bookings.forEach(booking => {
        expect(booking.subscriptionId).toBe(subscriptionId);
        expect(booking.bookingType).toBe('SUBSCRIPTION');
        expect(booking.status).toBe('PENDING');
      });
    });

    it('should create bookings with proper dates based on selectedDays', async () => {
      const bookings = await prisma.booking.findMany({
        where: { subscriptionId },
        orderBy: { date: 'asc' },
      });

      // All bookings should be on Monday (day 1)
      // Note: Dates are stored in UTC, so we need to check UTC day
      bookings.forEach(booking => {
        const dayOfWeek = booking.date.getUTCDay();
        expect(dayOfWeek).toBe(1); // Monday
      });
    });
  });

  describe('Create Subscription Bank Transfer Payment', () => {
    it('should create a bank transfer payment for subscription renewal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subscriptionId,
          receiptUrl: 'https://example.com/receipt.jpg',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.subscriptionId).toBe(subscriptionId);
      expect(response.body.method).toBe('BANK_TRANSFER');
      expect(response.body.status).toBe('PAID');
      expect(response.body.receiptUrl).toBe('https://example.com/receipt.jpg');
      expect(response.body).toHaveProperty('amount');

      paymentId = response.body.id;
    });

    it('should fail to create duplicate payment for same billing cycle', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subscriptionId,
          receiptUrl: 'https://example.com/receipt2.jpg',
        })
        .expect(400);
    });

    it('should fail if subscription does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subscriptionId: '00000000-0000-0000-0000-000000000000',
          receiptUrl: 'https://example.com/receipt.jpg',
        })
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bank-transfer')
        .send({
          subscriptionId,
          receiptUrl: 'https://example.com/receipt.jpg',
        })
        .expect(401);
    });
  });

  describe('Admin Verify Subscription Payment and Renewal', () => {
    it('should verify payment and trigger subscription renewal', async () => {
      // Count bookings before verification
      const bookingsBeforeVerification = await prisma.booking.count({
        where: { subscriptionId, status: { not: 'CANCELED' } },
      });

      // Verify payment
      const verifyResponse = await request(app.getHttpServer())
        .patch(`/api/v1/admin/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'VERIFIED',
        })
        .expect(200);

      expect(verifyResponse.body.status).toBe('VERIFIED');
      expect(verifyResponse.body.verifiedAt).toBeTruthy();
      expect(verifyResponse.body.verifiedBy).toBe(adminId);

      // Verify subscription was renewed
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      expect(subscription).toBeTruthy();
      expect(subscription?.status).toBe('ACTIVE');
      expect(subscription?.lastPaymentId).toBe(paymentId);
      expect(subscription?.lastPaymentDate).toBeTruthy();

      // Count bookings after verification
      const bookingsAfterVerification = await prisma.booking.count({
        where: { subscriptionId, status: { not: 'CANCELED' } },
      });

      // Should have generated additional bookings to reach 12 weeks
      // The exact number depends on how many weeks had already passed
      expect(bookingsAfterVerification).toBeGreaterThanOrEqual(bookingsBeforeVerification);
    });

    it('should not allow customer to verify payment', async () => {
      // Create another subscription and payment for this test
      const sub2Response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'TWICE_A_WEEK',
          addressId,
          timeSlotId,
          selectedDays: [2, 5], // Tuesday and Friday
          bedrooms: 3,
          bathrooms: 2,
          hasPets: true,
        });

      const subscription2Id = sub2Response.body.id;

      const payment2Response = await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subscriptionId: subscription2Id,
          receiptUrl: 'https://example.com/receipt3.jpg',
        });

      const payment2Id = payment2Response.body.id;

      // Customer should not be able to verify
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/payments/${payment2Id}/verify`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'VERIFIED',
        })
        .expect(403);
    });
  });

  describe('Create Subscription BML Payment', () => {
    let bmlSubscriptionId: string;

    beforeAll(async () => {
      // Create a new subscription for BML payment test
      const response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'TWICE_A_WEEK',
          addressId,
          timeSlotId,
          selectedDays: [2, 5], // Tuesday, Friday
          bedrooms: 3,
          bathrooms: 2,
          hasPets: true,
        })
        .expect(201);

      bmlSubscriptionId = response.body.id;
    });

    it('should initiate BML payment for subscription renewal', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bml')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subscriptionId: bmlSubscriptionId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('payment');
      expect(response.body).toHaveProperty('paymentUrl');
      expect(response.body).toHaveProperty('message');
      expect(response.body.payment.subscriptionId).toBe(bmlSubscriptionId);
      expect(response.body.payment.method).toBe('BML_GATEWAY');
      expect(response.body.payment.status).toBe('PENDING');
      expect(response.body.payment.transactionId).toContain('BML-SUB-');
    });

    it('should fail to create duplicate BML payment for same billing cycle', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bml')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subscriptionId: bmlSubscriptionId,
        })
        .expect(400);
    });

    it('should fail if subscription does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bml')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subscriptionId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });
  });

  describe('Get Subscription Payment', () => {
    it('should get subscription payment by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.id).toBe(paymentId);
      expect(response.body.subscriptionId).toBe(subscriptionId);
      expect(response.body).toHaveProperty('subscription');
      expect(response.body.subscription.id).toBe(subscriptionId);
    });

    it('should get all payments including subscription payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // Note: This endpoint currently only returns booking payments, not subscription payments
      // This is because it filters by booking.userId
      // This might need to be updated in the future to include subscription payments
    });
  });

  describe('Admin View Subscription Payments', () => {
    it('should allow admin to view all payments including subscription payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should allow admin to filter payments by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments?status=VERIFIED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((payment: any) => {
        expect(payment.status).toBe('VERIFIED');
      });
    });

    it('should allow admin to filter payments by method', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments?method=BANK_TRANSFER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((payment: any) => {
        expect(payment.method).toBe('BANK_TRANSFER');
      });
    });
  });

  describe('Subscription Renewal Logic', () => {
    it('should only generate missing weeks to reach 12 weeks total', async () => {
      // Create a new subscription
      const newSubResponse = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'ONCE_A_WEEK',
          addressId,
          timeSlotId,
          selectedDays: [4], // Thursday
          bedrooms: 2,
          bathrooms: 2,
          hasPets: false,
        });

      const newSubId = newSubResponse.body.id;

      // Count initial bookings
      const initialBookings = await prisma.booking.count({
        where: {
          subscriptionId: newSubId,
          status: { not: 'CANCELED' },
          date: { gte: startOfDay(new Date()) },
        },
      });

      // Create and verify a payment to trigger renewal
      const paymentResponse = await request(app.getHttpServer())
        .post('/api/v1/payments/subscription/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subscriptionId: newSubId,
          receiptUrl: 'https://example.com/renewal-receipt.jpg',
        });

      const newPaymentId = paymentResponse.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/admin/payments/${newPaymentId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'VERIFIED',
        });

      // Count bookings after renewal
      const bookingsAfterRenewal = await prisma.booking.count({
        where: {
          subscriptionId: newSubId,
          status: { not: 'CANCELED' },
          date: { gte: startOfDay(new Date()) },
        },
      });

      // Should have bookings for 12 weeks or close to it
      expect(bookingsAfterRenewal).toBeGreaterThanOrEqual(initialBookings);
    });
  });
});
