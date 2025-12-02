import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Subscriptions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const mockOtpCode = '123456';

  // Test user IDs
  let adminId: string;
  let customerId: string;
  let customer2Id: string;
  let adminToken: string;
  let customerToken: string;
  let customer2Token: string;

  // Test data IDs
  let addressId: string;
  let address2Id: string;
  let timeSlotId: string;
  let subscriptionId: string;

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
        streetAddress: 'Test Street',
        city: 'Male',
        island: 'Male',
        label: 'Home',
      });

    addressId = addressResponse.body.id;

    // Create address for second customer
    const address2Response = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        streetAddress: 'Another Street',
        city: 'Male',
        island: 'Male',
        label: 'Home',
      });

    address2Id = address2Response.body.id;

    // Get a time slot
    const timeSlotsResponse = await request(app.getHttpServer())
      .get('/api/v1/time-slots')
      .set('Authorization', `Bearer ${customerToken}`);

    timeSlotId = timeSlotsResponse.body[0].id;
  });

  afterAll(async () => {
    // Clean up test data
    const userIds = [customerId, customer2Id, adminId].filter(Boolean);

    if (userIds.length > 0) {
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

  describe('Create Subscription', () => {
    it('should create a HOME subscription with ONCE_A_WEEK frequency', async () => {
      const response = await request(app.getHttpServer())
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
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.serviceType).toBe('HOME');
      expect(response.body.frequency).toBe('ONCE_A_WEEK');
      expect(response.body.selectedDays).toEqual([1]);
      expect(response.body.bedrooms).toBe(2);
      expect(response.body.bathrooms).toBe(2);
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body).toHaveProperty('monthlyPrice');

      subscriptionId = response.body.id;
    });

    it('should create a HOME subscription with TWICE_A_WEEK frequency', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'TWICE_A_WEEK',
          addressId,
          timeSlotId,
          selectedDays: [1, 4], // Monday and Thursday
          bedrooms: 3,
          bathrooms: 2,
          hasPets: true,
        })
        .expect(201);

      expect(response.body.frequency).toBe('TWICE_A_WEEK');
      expect(response.body.selectedDays).toEqual([1, 4]);
    });

    it('should create a HOME subscription with multiple days', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'ONCE_A_WEEK',
          addressId,
          timeSlotId,
          selectedDays: [3], // Wednesday
          bedrooms: 1,
          bathrooms: 1,
          hasPets: false,
        })
        .expect(201);

      expect(response.body.serviceType).toBe('HOME');
      expect(response.body.frequency).toBe('ONCE_A_WEEK');
      expect(response.body.bedrooms).toBe(1);
    });

    it('should fail if selectedDays count does not match frequency', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'ONCE_A_WEEK',
          addressId,
          timeSlotId,
          selectedDays: [1, 3], // 2 days but frequency is once a week
          bedrooms: 2,
          bathrooms: 2,
        })
        .expect(400);
    });

    it('should fail if selectedDays contains duplicates', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'TWICE_A_WEEK',
          addressId,
          timeSlotId,
          selectedDays: [1, 1], // Duplicate day
          bedrooms: 2,
          bathrooms: 2,
        })
        .expect(400);
    });

    it('should fail if address does not belong to user', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'ONCE_A_WEEK',
          addressId: address2Id, // Belongs to customer2
          timeSlotId,
          selectedDays: [1],
          bedrooms: 2,
          bathrooms: 2,
        })
        .expect(404);
    });

    it('should fail if time slot does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          frequency: 'ONCE_A_WEEK',
          addressId,
          timeSlotId: '00000000-0000-0000-0000-000000000000',
          selectedDays: [1],
          bedrooms: 2,
          bathrooms: 2,
        })
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .send({
          serviceType: 'HOME',
          frequency: 'ONCE_A_WEEK',
          addressId,
          timeSlotId,
          selectedDays: [1],
          bedrooms: 2,
          bathrooms: 2,
        })
        .expect(401);
    });
  });

  describe('Get User Subscriptions', () => {
    it('should get all subscriptions for the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('frequency');
      expect(response.body[0]).toHaveProperty('status');
    });

    it('should return empty array if user has no subscriptions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customer2Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('Get Specific Subscription', () => {
    it('should get a specific subscription by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.id).toBe(subscriptionId);
      expect(response.body).toHaveProperty('frequency');
      expect(response.body).toHaveProperty('selectedDays');
    });

    it('should fail if trying to access another user\'s subscription', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .expect(403);
    });

    it('should fail if subscription does not exist', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/subscriptions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('Update Subscription', () => {
    it('should update subscription time slot', async () => {
      // Get another time slot
      const timeSlotsResponse = await request(app.getHttpServer())
        .get('/api/v1/time-slots')
        .set('Authorization', `Bearer ${customerToken}`);

      const newTimeSlotId = timeSlotsResponse.body[1]?.id || timeSlotId;

      const response = await request(app.getHttpServer())
        .put(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          timeSlotId: newTimeSlotId,
        })
        .expect(200);

      expect(response.body.timeSlotId).toBe(newTimeSlotId);
    });

    it('should update subscription selected days', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          selectedDays: [2], // Tuesday
        })
        .expect(200);

      expect(response.body.selectedDays).toEqual([2]);
    });

    it('should fail to update with invalid days count', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          selectedDays: [1, 3], // 2 days but subscription is ONCE_A_WEEK
        })
        .expect(400);
    });

    it('should fail to update another user\'s subscription', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/subscriptions/${subscriptionId}`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          selectedDays: [3],
        })
        .expect(403);
    });
  });

  describe('Pause Subscription', () => {
    it('should pause an active subscription', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/subscriptions/${subscriptionId}/pause`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toContain('paused');
      expect(response.body.subscription.status).toBe('PAUSED');
    });

    it('should fail to pause an already paused subscription', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/subscriptions/${subscriptionId}/pause`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);
    });
  });

  describe('Resume Subscription', () => {
    it('should resume a paused subscription', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/subscriptions/${subscriptionId}/resume`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toContain('resumed');
      expect(response.body.subscription.status).toBe('ACTIVE');
    });

    it('should fail to resume an active subscription', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/subscriptions/${subscriptionId}/resume`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);
    });
  });

  describe('Cancel Subscription', () => {
    it('should cancel a subscription', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/subscriptions/${subscriptionId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toContain('canceled');
      expect(response.body.subscription.status).toBe('CANCELED');
      expect(response.body.subscription.autoRenew).toBe(false);
      expect(response.body.subscription.endDate).toBeTruthy();
    });

    it('should fail to cancel an already canceled subscription', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/subscriptions/${subscriptionId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);
    });
  });

  describe('Admin - View Subscriptions', () => {
    let activeSubscriptionId: string;

    beforeAll(async () => {
      // Create a new active subscription for admin tests
      const response = await request(app.getHttpServer())
        .post('/api/v1/subscriptions')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          serviceType: 'HOME',
          frequency: 'ONCE_A_WEEK',
          addressId: address2Id,
          timeSlotId,
          selectedDays: [3],
          bedrooms: 2,
          bathrooms: 2,
        });

      activeSubscriptionId = response.body.id;
    });

    it('should allow admin to view all subscriptions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should allow admin to filter subscriptions by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/admin/subscriptions?status=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((sub: any) => {
        expect(sub.status).toBe('ACTIVE');
      });
    });

    it('should allow admin to filter subscriptions by userId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/subscriptions?userId=${customer2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((sub: any) => {
        expect(sub.userId).toBe(customer2Id);
      });
    });

    it('should allow admin to view a specific subscription', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/subscriptions/${activeSubscriptionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(activeSubscriptionId);
    });

    it('should not allow customer to access admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/subscriptions')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});
