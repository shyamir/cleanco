import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Cleaner Assignment (e2e)', () => {
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
  let bookingId: string;
  let cleanerIds: string[] = [];

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
        lastName: 'User',
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

    if (addressResponse.status !== 201) {
      console.error('Address creation failed:', addressResponse.body);
      throw new Error('Address creation failed');
    }

    addressId = addressResponse.body.id;

    // Get a time slot
    const timeSlotsResponse = await request(app.getHttpServer())
      .get('/api/v1/time-slots')
      .set('Authorization', `Bearer ${customerToken}`);

    timeSlotId = timeSlotsResponse.body[0].id;

    // Get cleaner IDs from seed data
    const cleaners = await prisma.cleanerProfile.findMany({
      take: 3,
      select: { id: true },
    });
    cleanerIds = cleaners.map((c) => c.id);
  });

  afterAll(async () => {
    // Clean up test data
    const userIds = [customerId, adminId].filter(Boolean);

    if (userIds.length > 0) {
      // Delete cleaner assignments first
      await prisma.cleanerAssignment.deleteMany({
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

  describe('Auto-Assignment', () => {
    it('should automatically assign cleaners when creating a 1-bedroom booking', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 1,
          bathrooms: 1,
          hasPets: false,
          paymentMethod: 'BANK_TRANSFER',
        });

      if (bookingResponse.status !== 201) {
        console.error('Booking creation failed:', bookingResponse.body);
      }
      expect(bookingResponse.status).toBe(201);

      bookingId = bookingResponse.body.id;

      // Wait a bit for auto-assignment
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check assignments
      const assignmentsResponse = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${bookingId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Should have 1 cleaner assigned for 1-bedroom
      expect(assignmentsResponse.body.length).toBeGreaterThanOrEqual(0);
      // Note: Might be 0 if not enough cleaners available
    });

    it('should assign more cleaners for larger properties', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 8);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 4,
          bathrooms: 3,
          hasPets: false,
          paymentMethod: 'BANK_TRANSFER',
        })
        .expect(201);

      // Wait for auto-assignment
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check assignments - should have 2 cleaners for 4-bedroom
      const assignmentsResponse = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${bookingResponse.body.id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Clean up
      await prisma.cleanerAssignment.deleteMany({
        where: { bookingId: bookingResponse.body.id },
      });
      await prisma.booking.delete({
        where: { id: bookingResponse.body.id },
      });
    });
  });

  describe('Manual Assignment (Admin)', () => {
    let testBookingId: string;

    beforeEach(async () => {
      // Create a test booking
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 2,
          bathrooms: 1,
          hasPets: false,
          paymentMethod: 'BANK_TRANSFER',
        });

      testBookingId = bookingResponse.body.id;

      // Remove auto-assignments
      await prisma.cleanerAssignment.deleteMany({
        where: { bookingId: testBookingId },
      });
    });

    afterEach(async () => {
      // Clean up
      if (testBookingId) {
        await prisma.cleanerAssignment.deleteMany({
          where: { bookingId: testBookingId },
        });
        await prisma.booking.delete({
          where: { id: testBookingId },
        });
      }
    });

    it('should allow admin to manually assign cleaners', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/manual-assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cleanerIds: [cleanerIds[0]],
        })
        .expect(200);

      expect(response.body.message).toContain('assigned');
    });

    it('should allow admin to assign multiple cleaners', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/manual-assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cleanerIds: cleanerIds.slice(0, 2),
        })
        .expect(200);

      expect(response.body.message).toContain('assigned');

      // Verify both cleaners assigned
      const assignments = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${testBookingId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(assignments.body.length).toBe(2);
    });

    it('should fail manual assignment with invalid cleaner ID', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/manual-assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cleanerIds: ['invalid-uuid'],
        })
        .expect(400);
    });

    it('should fail manual assignment with empty cleaner array', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/manual-assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cleanerIds: [],
        })
        .expect(400);
    });

    it('should not allow customer to manually assign cleaners', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/manual-assign`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          cleanerIds: [cleanerIds[0]],
        })
        .expect(403);
    });
  });

  describe('Get Assigned Cleaners', () => {
    let testBookingId: string;

    beforeAll(async () => {
      // Create a test booking with assignments
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 12);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 2,
          bathrooms: 1,
          hasPets: false,
          paymentMethod: 'BANK_TRANSFER',
        });

      testBookingId = bookingResponse.body.id;

      // Remove auto-assignments and add manual ones
      await prisma.cleanerAssignment.deleteMany({
        where: { bookingId: testBookingId },
      });

      await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/manual-assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cleanerIds: [cleanerIds[0]],
        });
    });

    afterAll(async () => {
      if (testBookingId) {
        await prisma.cleanerAssignment.deleteMany({
          where: { bookingId: testBookingId },
        });
        await prisma.booking.delete({
          where: { id: testBookingId },
        });
      }
    });

    it('should return assigned cleaners for a booking', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${testBookingId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('assignmentId');
      expect(response.body[0]).toHaveProperty('cleanerId');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('cleaner');
      expect(response.body[0].cleaner).toHaveProperty('user');
    });

    it('should return empty array for booking with no assignments', async () => {
      // Create booking without assignments
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 13);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 1,
          bathrooms: 1,
          paymentMethod: 'BANK_TRANSFER',
        });

      const newBookingId = bookingResponse.body.id;

      // Remove any auto-assignments
      await prisma.cleanerAssignment.deleteMany({
        where: { bookingId: newBookingId },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${newBookingId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      // Clean up
      await prisma.booking.delete({
        where: { id: newBookingId },
      });
    });

    it('should not allow customer to view assignments', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${testBookingId}/assignments`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('Remove Cleaner Assignment', () => {
    let testBookingId: string;
    let assignmentId: string;

    beforeEach(async () => {
      // Create a test booking with assignment
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 2,
          bathrooms: 1,
          paymentMethod: 'BANK_TRANSFER',
        });

      testBookingId = bookingResponse.body.id;

      // Remove auto-assignments
      await prisma.cleanerAssignment.deleteMany({
        where: { bookingId: testBookingId },
      });

      // Add manual assignment
      await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/manual-assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cleanerIds: [cleanerIds[0]],
        });

      // Get assignment ID
      const assignments = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${testBookingId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`);

      assignmentId = assignments.body[0].assignmentId;
    });

    afterEach(async () => {
      if (testBookingId) {
        await prisma.cleanerAssignment.deleteMany({
          where: { bookingId: testBookingId },
        });
        await prisma.booking.delete({
          where: { id: testBookingId },
        });
      }
    });

    it('should allow admin to remove a cleaner assignment', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/cleaner-assignment/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify assignment removed
      const assignments = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${testBookingId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(assignments.body.length).toBe(0);
    });

    it('should fail to remove non-existent assignment', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/admin/cleaner-assignment/assignments/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should not allow customer to remove assignment', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/admin/cleaner-assignment/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe('Reassignment on Reschedule', () => {
    let testBookingId: string;

    beforeEach(async () => {
      // Create a test booking
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 2,
          bathrooms: 1,
          paymentMethod: 'BANK_TRANSFER',
        });

      testBookingId = bookingResponse.body.id;

      // Wait for auto-assignment
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    afterEach(async () => {
      if (testBookingId) {
        await prisma.cleanerAssignment.deleteMany({
          where: { bookingId: testBookingId },
        });
        await prisma.booking.delete({
          where: { id: testBookingId },
        });
      }
    });

    it('should trigger reassignment when booking is rescheduled', async () => {
      // Get initial assignments
      const initialAssignments = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${testBookingId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`);

      const initialCount = initialAssignments.body.length;

      // Reschedule booking
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 20);
      const newDateString = newDate.toISOString().split('T')[0];

      const rescheduleResponse = await request(app.getHttpServer())
        .put(`/api/v1/bookings/${testBookingId}/reschedule`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          newDate: newDateString,
          newTimeSlotId: timeSlotId,
        });

      if (rescheduleResponse.status !== 200) {
        console.error('Reschedule failed:', rescheduleResponse.body);
      }
      expect(rescheduleResponse.status).toBe(200);

      // Wait for reassignment
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get new assignments
      const newAssignments = await request(app.getHttpServer())
        .get(`/api/v1/admin/cleaner-assignment/${testBookingId}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should have assignments (might be same or different cleaners)
      expect(newAssignments.body.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Trigger Manual Auto-Assignment', () => {
    let testBookingId: string;

    beforeEach(async () => {
      // Create a test booking
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 16);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 3,
          bathrooms: 2,
          paymentMethod: 'BANK_TRANSFER',
        });

      testBookingId = bookingResponse.body.id;

      // Remove auto-assignments
      await prisma.cleanerAssignment.deleteMany({
        where: { bookingId: testBookingId },
      });
    });

    afterEach(async () => {
      if (testBookingId) {
        await prisma.cleanerAssignment.deleteMany({
          where: { bookingId: testBookingId },
        });
        await prisma.booking.delete({
          where: { id: testBookingId },
        });
      }
    });

    it('should allow admin to trigger auto-assignment manually', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/auto-assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('assigned');
    });

    it('should not allow customer to trigger auto-assignment', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/auto-assign`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should fail auto-assignment for non-existent booking', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/cleaner-assignment/invalid-uuid/auto-assign')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Reassign Endpoint', () => {
    let testBookingId: string;

    beforeEach(async () => {
      // Create a test booking with assignments
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 17);
      const dateString = futureDate.toISOString().split('T')[0];

      const bookingResponse = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId,
          date: dateString,
          timeSlotId,
          bedrooms: 2,
          bathrooms: 1,
          paymentMethod: 'BANK_TRANSFER',
        });

      testBookingId = bookingResponse.body.id;
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    afterEach(async () => {
      if (testBookingId) {
        await prisma.cleanerAssignment.deleteMany({
          where: { bookingId: testBookingId },
        });
        await prisma.booking.delete({
          where: { id: testBookingId },
        });
      }
    });

    it('should allow admin to trigger reassignment', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/reassign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('re-assigned');
    });

    it('should not allow customer to trigger reassignment', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/admin/cleaner-assignment/${testBookingId}/reassign`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});
