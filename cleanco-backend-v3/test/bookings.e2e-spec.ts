import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Bookings E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;
  let customerId: string;
  let adminId: string;
  let addressId: string;
  let timeSlotId: string;
  let bookingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Setup: Create customer and admin users
    await setupTestUsers();

    // Setup: Get a time slot ID
    const timeSlots = await prisma.timeSlot.findMany({ take: 1 });
    timeSlotId = timeSlots[0].id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    const userIds = [customerId, adminId].filter(Boolean);

    if (userIds.length > 0) {
      await prisma.booking.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.address.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }

    await app.close();
  });

  // Helper function to generate unique Maldivian phone numbers
  const generatePhoneNumber = () => {
    // Maldivian numbers must start with 7 or 9
    const firstDigit = Math.random() < 0.5 ? '7' : '9';
    const remainingDigits = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    return `+960${firstDigit}${remainingDigits}`;
  };

  async function setupTestUsers() {
    // Create customer
    const customerPhone = generatePhoneNumber();
    let response = await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: customerPhone })
      .expect(200);

    response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: customerPhone,
        code: '123456',
        firstName: 'Test',
        lastName: 'Customer',
      })
      .expect(200);

    customerToken = response.body.accessToken;
    customerId = response.body.user.id;

    // Create admin
    const adminPhone = generatePhoneNumber();
    response = await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: adminPhone })
      .expect(200);

    response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: adminPhone,
        code: '123456',
        firstName: 'Test',
        lastName: 'Admin',
      })
      .expect(200);

    adminToken = response.body.accessToken;
    adminId = response.body.user.id;

    // Update admin role
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    // Get new admin token with updated role
    response = await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: adminPhone })
      .expect(200);

    response = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({ phoneNumber: adminPhone, code: '123456' })
      .expect(200);

    adminToken = response.body.accessToken;

    // Create address for customer
    response = await request(app.getHttpServer())
      .post('/api/v1/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        label: 'Test Home',
        streetAddress: 'Test Street',
        city: 'Male',
        island: 'Male',
        postalCode: '20000',
      })
      .expect(201);

    addressId = response.body.id;
  }

  describe('Time Slots', () => {
    it('should get all time slots', () => {
      return request(app.getHttpServer())
        .get('/api/v1/time-slots')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('startTime');
          expect(res.body[0]).toHaveProperty('endTime');
          expect(res.body[0]).toHaveProperty('displayStartTime');
        });
    });

    it('should get available time slots for a future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = futureDate.toISOString().split('T')[0];

      return request(app.getHttpServer())
        .get(`/api/v1/time-slots/available?date=${dateString}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('date', dateString);
          expect(res.body).toHaveProperty('isBlackoutDate', false);
          expect(res.body).toHaveProperty('availableSlots');
          expect(res.body.availableSlots).toBeInstanceOf(Array);
        });
    });

    it('should reject past dates for availability check', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const dateString = pastDate.toISOString().split('T')[0];

      return request(app.getHttpServer())
        .get(`/api/v1/time-slots/available?date=${dateString}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('past dates');
        });
    });
  });

  describe('Customer Bookings', () => {
    describe('POST /api/v1/bookings', () => {
      it('should create a HOME service booking', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const dateString = futureDate.toISOString().split('T')[0];

        const response = await request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            serviceType: 'HOME',
            bookingType: 'ONE_TIME',
            addressId: addressId,
            date: dateString,
            timeSlotId: timeSlotId,
            bedrooms: 2,
            bathrooms: 1,
            hasPets: false,
            paymentMethod: 'BANK_TRANSFER',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('bookingNumber');
        expect(response.body.bookingNumber).toMatch(/^BK-/);
        expect(response.body.status).toBe('PENDING');
        expect(response.body.serviceType).toBe('HOME');
        expect(response.body.bedrooms).toBe(2);
        expect(response.body.bathrooms).toBe(1);

        bookingId = response.body.id;
      });

      it('should create an OFFICE service booking', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 45); // Use 45 days to avoid blackout dates
        const dateString = futureDate.toISOString().split('T')[0];

        const response = await request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            serviceType: 'OFFICE',
            bookingType: 'ONE_TIME',
            addressId: addressId,
            date: dateString,
            timeSlotId: timeSlotId,
            officeSize: 'Small',
            floors: 1,
            rooms: 3,
            paymentMethod: 'BML_GATEWAY',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.serviceType).toBe('OFFICE');
        expect(response.body.officeSize).toBe('Small');
        expect(response.body.floors).toBe(1);
        expect(response.body.rooms).toBe(3);
      });

      it('should reject booking for past date', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const dateString = pastDate.toISOString().split('T')[0];

        return request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            serviceType: 'HOME',
            bookingType: 'ONE_TIME',
            addressId: addressId,
            date: dateString,
            timeSlotId: timeSlotId,
            bedrooms: 2,
            bathrooms: 1,
            paymentMethod: 'BANK_TRANSFER',
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('past dates');
          });
      });

      it('should reject booking with invalid address', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const dateString = futureDate.toISOString().split('T')[0];

        return request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            serviceType: 'HOME',
            bookingType: 'ONE_TIME',
            addressId: '00000000-0000-0000-0000-000000000000',
            date: dateString,
            timeSlotId: timeSlotId,
            bedrooms: 2,
            bathrooms: 1,
            paymentMethod: 'BANK_TRANSFER',
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('address');
          });
      });

      it('should reject booking on Christmas Day (blackout date)', async () => {
        const christmas = '2025-12-25';

        return request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            serviceType: 'HOME',
            bookingType: 'ONE_TIME',
            addressId: addressId,
            date: christmas,
            timeSlotId: timeSlotId,
            bedrooms: 2,
            bathrooms: 1,
            paymentMethod: 'BANK_TRANSFER',
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('Christmas');
          });
      });
    });

    describe('GET /api/v1/bookings', () => {
      it('should get all bookings for current user', () => {
        return request(app.getHttpServer())
          .get('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toBeInstanceOf(Array);
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('bookingNumber');
            expect(res.body[0]).toHaveProperty('address');
            expect(res.body[0]).toHaveProperty('timeSlot');
          });
      });
    });

    describe('GET /api/v1/bookings/:id', () => {
      it('should get booking details by ID', () => {
        return request(app.getHttpServer())
          .get(`/api/v1/bookings/${bookingId}`)
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(bookingId);
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('address');
            expect(res.body).toHaveProperty('timeSlot');
          });
      });

      it('should return 404 for non-existent booking', () => {
        return request(app.getHttpServer())
          .get('/api/v1/bookings/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/v1/bookings/:id/reschedule', () => {
      it('should reschedule a booking', async () => {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 35);
        const dateString = newDate.toISOString().split('T')[0];

        const response = await request(app.getHttpServer())
          .put(`/api/v1/bookings/${bookingId}/reschedule`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            newDate: dateString,
            newTimeSlotId: timeSlotId,
          })
          .expect(200);

        expect(response.body.rescheduledCount).toBe(1);
        expect(response.body).toHaveProperty('originalDate');
        expect(response.body).toHaveProperty('originalTimeSlotId');
      });

      it('should reject second reschedule attempt (limit reached)', async () => {
        const newDate = new Date();
        newDate.setDate(newDate.getDate() + 40);
        const dateString = newDate.toISOString().split('T')[0];

        return request(app.getHttpServer())
          .put(`/api/v1/bookings/${bookingId}/reschedule`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            newDate: dateString,
            newTimeSlotId: timeSlotId,
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('Maximum reschedule limit');
          });
      });
    });

    describe('PUT /api/v1/bookings/:id/cancel', () => {
      it('should cancel a booking', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/v1/bookings/${bookingId}/cancel`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            cancelReason: 'Test cancellation',
          })
          .expect(200);

        expect(response.body.message).toContain('canceled successfully');
        expect(response.body.booking.status).toBe('CANCELED');
        expect(response.body.booking.cancelReason).toBe('Test cancellation');
        expect(response.body.booking).toHaveProperty('canceledAt');
      });

      it('should reject canceling already canceled booking', () => {
        return request(app.getHttpServer())
          .put(`/api/v1/bookings/${bookingId}/cancel`)
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            cancelReason: 'Trying again',
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('already canceled');
          });
      });
    });
  });

  describe('Admin Bookings', () => {
    let adminBookingId: string;

    beforeAll(async () => {
      // Create a test booking for admin operations
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 45);
      const dateString = futureDate.toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceType: 'HOME',
          bookingType: 'ONE_TIME',
          addressId: addressId,
          date: dateString,
          timeSlotId: timeSlotId,
          bedrooms: 3,
          bathrooms: 2,
          paymentMethod: 'BANK_TRANSFER',
        })
        .expect(201);

      adminBookingId = response.body.id;
    });

    describe('GET /api/v1/admin/bookings', () => {
      it('should get all bookings with pagination', () => {
        return request(app.getHttpServer())
          .get('/api/v1/admin/bookings')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.data).toBeInstanceOf(Array);
            expect(res.body.pagination).toHaveProperty('total');
            expect(res.body.pagination).toHaveProperty('page');
            expect(res.body.pagination).toHaveProperty('limit');
            expect(res.body.pagination).toHaveProperty('totalPages');
          });
      });

      it('should filter bookings by status', () => {
        return request(app.getHttpServer())
          .get('/api/v1/admin/bookings?status=PENDING')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toBeInstanceOf(Array);
            if (res.body.data.length > 0) {
              res.body.data.forEach((booking: any) => {
                expect(booking.status).toBe('PENDING');
              });
            }
          });
      });

      it('should filter bookings by service type', () => {
        return request(app.getHttpServer())
          .get('/api/v1/admin/bookings?serviceType=HOME')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.data).toBeInstanceOf(Array);
            if (res.body.data.length > 0) {
              res.body.data.forEach((booking: any) => {
                expect(booking.serviceType).toBe('HOME');
              });
            }
          });
      });

      it('should deny access to non-admin users', () => {
        return request(app.getHttpServer())
          .get('/api/v1/admin/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(403);
      });
    });

    describe('GET /api/v1/admin/bookings/statistics', () => {
      it('should get booking statistics', () => {
        return request(app.getHttpServer())
          .get('/api/v1/admin/bookings/statistics')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('total');
            expect(res.body).toHaveProperty('pending');
            expect(res.body).toHaveProperty('confirmed');
            expect(res.body).toHaveProperty('completed');
            expect(res.body).toHaveProperty('canceled');
            expect(typeof res.body.total).toBe('number');
          });
      });
    });

    describe('GET /api/v1/admin/bookings/:id', () => {
      it('should get any booking details', () => {
        return request(app.getHttpServer())
          .get(`/api/v1/admin/bookings/${adminBookingId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(adminBookingId);
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('address');
            expect(res.body).toHaveProperty('timeSlot');
          });
      });
    });

    describe('PUT /api/v1/admin/bookings/:id/status', () => {
      it('should update booking status to CONFIRMED', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/v1/admin/bookings/${adminBookingId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'CONFIRMED',
            notes: 'Approved by admin',
          })
          .expect(200);

        expect(response.body.message).toContain('CONFIRMED');
        expect(response.body.booking.status).toBe('CONFIRMED');
        expect(response.body.booking.adminApproved).toBe(true);
      });

      it('should update booking status to IN_PROGRESS', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/v1/admin/bookings/${adminBookingId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'IN_PROGRESS',
          })
          .expect(200);

        expect(response.body.booking.status).toBe('IN_PROGRESS');
      });

      it('should update booking status to COMPLETED', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/v1/admin/bookings/${adminBookingId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'COMPLETED',
          })
          .expect(200);

        expect(response.body.booking.status).toBe('COMPLETED');
      });

      it('should reject changing status of completed booking', () => {
        return request(app.getHttpServer())
          .put(`/api/v1/admin/bookings/${adminBookingId}/status`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            status: 'PENDING',
          })
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('completed');
          });
      });
    });

    describe('DELETE /api/v1/admin/bookings/:id', () => {
      it('should delete a booking', async () => {
        // Create a booking to delete
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 50);
        const dateString = futureDate.toISOString().split('T')[0];

        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/bookings')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            serviceType: 'HOME',
            bookingType: 'ONE_TIME',
            addressId: addressId,
            date: dateString,
            timeSlotId: timeSlotId,
            bedrooms: 2,
            bathrooms: 1,
            paymentMethod: 'BANK_TRANSFER',
          })
          .expect(201);

        const bookingToDelete = createResponse.body.id;

        // Delete the booking
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/api/v1/admin/bookings/${bookingToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(deleteResponse.body.message).toContain('deleted successfully');
        expect(deleteResponse.body).toHaveProperty('bookingNumber');

        // Verify it's deleted
        await request(app.getHttpServer())
          .get(`/api/v1/admin/bookings/${bookingToDelete}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });
});
