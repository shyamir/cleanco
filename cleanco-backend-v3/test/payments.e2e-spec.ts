import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Payments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let adminId: string;
  let customerToken: string;
  let customerId: string;
  let customer2Token: string;
  let customer2Id: string;

  let addressId: string;
  let timeSlotId: string;
  let bookingId: string;
  let booking2Id: string;
  let paymentId: string;
  let payment2Id: string;

  const mockOtpCode = '123456';

  const generatePhoneNumber = () => {
    return `960${Math.floor(1000000 + Math.random() * 9000000)}`;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

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

    // Create first customer user
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

    // Create second customer user
    const customer2Phone = generatePhoneNumber();
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: customer2Phone });

    const customer2AuthResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: customer2Phone,
        code: mockOtpCode,
        firstName: 'Customer',
        lastName: 'Two',
      });

    customer2Token = customer2AuthResponse.body.accessToken;
    customer2Id = customer2AuthResponse.body.user.id;

    // Create address for first customer
    const addressResponse = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        streetAddress: '123 Main St',
        city: 'Male',
        island: 'Male',
        postalCode: '20000',
        label: 'Home',
      });

    addressId = addressResponse.body.id;

    // Get a time slot
    const timeSlots = await prisma.timeSlot.findFirst({
      where: { isActive: true },
    });
    timeSlotId = timeSlots.id;

    // Create a booking for payment tests
    const bookingResponse = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        serviceType: 'HOME',
        bookingType: 'ONE_TIME',
        addressId,
        date: '2025-12-10',
        timeSlotId,
        bedrooms: 2,
        bathrooms: 2,
        hasPets: false,
      });

    bookingId = bookingResponse.body.id;

    // Create another booking for customer 2
    const address2Response = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        streetAddress: '456 Other St',
        city: 'Male',
        island: 'Male',
        postalCode: '20001',
        label: 'Home',
      });

    const booking2Response = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        serviceType: 'HOME',
        bookingType: 'ONE_TIME',
        addressId: address2Response.body.id,
        date: '2025-12-11',
        timeSlotId,
        bedrooms: 2,
        bathrooms: 2,
        hasPets: false,
      });

    booking2Id = booking2Response.body.id;
  });

  afterAll(async () => {
    const userIds = [customerId, customer2Id, adminId].filter(Boolean);

    if (userIds.length > 0) {
      // Delete payments
      await prisma.payment.deleteMany({
        where: {
          booking: {
            userId: { in: userIds },
          },
        },
      });

      // Delete bookings
      await prisma.booking.deleteMany({
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

  describe('Submit Bank Transfer Payment', () => {
    it('should create a bank transfer payment with receipt', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId,
          receiptUrl: 'https://example.com/receipts/receipt-123.jpg',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.bookingId).toBe(bookingId);
      expect(response.body.method).toBe('BANK_TRANSFER');
      expect(response.body.status).toBe('PAID');
      expect(response.body.receiptUrl).toBe('https://example.com/receipts/receipt-123.jpg');
      expect(response.body).toHaveProperty('paidAt');

      paymentId = response.body.id;
    });

    it('should fail if payment already exists for booking', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId,
          receiptUrl: 'https://example.com/receipts/receipt-456.jpg',
        })
        .expect(400);
    });

    it('should fail if booking does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: '00000000-0000-0000-0000-000000000000',
          receiptUrl: 'https://example.com/receipts/receipt-789.jpg',
        })
        .expect(404);
    });

    it('should fail if booking belongs to another user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: booking2Id,
          receiptUrl: 'https://example.com/receipts/receipt-999.jpg',
        })
        .expect(403);
    });

    it('should fail without authentication', async () => {
      const newBooking = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: '2025-12-12',
          timeSlotId,
          bedrooms: 2,
          bathrooms: 2,
          hasPets: false,
        });

      await request(app.getHttpServer())
        .post('/api/v1/payments/bank-transfer')
        .send({
          bookingId: newBooking.body.id,
          receiptUrl: 'https://example.com/receipts/receipt-111.jpg',
        })
        .expect(401);
    });
  });

  describe('Initiate BML Payment', () => {
    it('should initiate a BML payment gateway transaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/bml')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          bookingId: booking2Id,
        })
        .expect(201);

      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment.bookingId).toBe(booking2Id);
      expect(response.body.payment.method).toBe('BML_GATEWAY');
      expect(response.body.payment.status).toBe('PENDING');
      expect(response.body).toHaveProperty('paymentUrl');
      expect(response.body).toHaveProperty('message');

      payment2Id = response.body.payment.id;
    });

    it('should fail if booking does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/bml')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          bookingId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });

    it('should fail if booking belongs to another user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments/bml')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          bookingId,
        })
        .expect(403);
    });
  });

  describe('Get User Payments', () => {
    it('should get all payments for the authenticated customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('booking');
    });

    it('should return empty array if user has no payments', async () => {
      // Create a new user with no payments
      const newPhone = generatePhoneNumber();
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber: newPhone });

      const newAuthResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber: newPhone,
          code: mockOtpCode,
          firstName: 'New',
          lastName: 'Customer',
        });

      const response = await request(app.getHttpServer())
        .get('/api/v1/payments')
        .set('Authorization', `Bearer ${newAuthResponse.body.accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Cleanup
      await prisma.user.delete({ where: { id: newAuthResponse.body.user.id } });
    });
  });

  describe('Get Specific Payment', () => {
    it('should get a specific payment by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.id).toBe(paymentId);
      expect(response.body).toHaveProperty('booking');
      expect(response.body.booking.userId).toBe(customerId);
    });

    it('should fail if trying to access another user\'s payment', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/payments/${paymentId}`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .expect(403);
    });

    it('should fail if payment does not exist', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/payments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('Admin - View Payments', () => {
    it('should allow admin to view all payments', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should allow admin to filter payments by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments?status=PAID')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0].status).toBe('PAID');
      }
    });

    it('should allow admin to filter payments by method', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/payments?method=BANK_TRANSFER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0].method).toBe('BANK_TRANSFER');
      }
    });

    it('should allow admin to view a specific payment', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/payments/${paymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(paymentId);
    });

    it('should not allow customer to access admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/payments')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('Admin - Verify Payment', () => {
    it('should allow admin to verify a bank transfer payment', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'VERIFIED',
        })
        .expect(200);

      expect(response.body.status).toBe('VERIFIED');
      expect(response.body.verifiedBy).toBe(adminId);
      expect(response.body).toHaveProperty('verifiedAt');

      // Verify booking was updated
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });
      expect(booking.paymentStatus).toBe('VERIFIED');
      expect(booking.status).toBe('CONFIRMED');
      expect(booking.adminApproved).toBe(true);
    });

    it('should allow admin to reject a payment', async () => {
      // Create a new booking and payment for rejection test
      const newBooking = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: '2025-12-13',
          timeSlotId,
          bedrooms: 2,
          bathrooms: 2,
          hasPets: false,
        });

      const newPayment = await request(app.getHttpServer())
        .post('/api/v1/payments/bank-transfer')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: newBooking.body.id,
          receiptUrl: 'https://example.com/receipts/reject-test.jpg',
        });

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/admin/payments/${newPayment.body.id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'FAILED',
          failureReason: 'Invalid receipt',
        })
        .expect(200);

      expect(response.body.status).toBe('FAILED');
      expect(response.body.failureReason).toBe('Invalid receipt');

      // Verify booking was updated
      const booking = await prisma.booking.findUnique({
        where: { id: newBooking.body.id },
      });
      expect(booking.paymentStatus).toBe('FAILED');
    });

    it('should fail to verify a BML payment (only bank transfer can be manually verified)', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/payments/${payment2Id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'VERIFIED',
        })
        .expect(400);
    });

    it('should fail if payment does not exist', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/payments/00000000-0000-0000-0000-000000000000/verify')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'VERIFIED',
        })
        .expect(404);
    });

    it('should not allow customer to verify payments', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/payments/${paymentId}/verify`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'VERIFIED',
        })
        .expect(403);
    });
  });
});
