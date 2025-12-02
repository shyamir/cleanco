import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ServiceType, SubscriptionFrequency } from '@prisma/client';

describe('Services (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let customerToken: string;
  let serviceId: string;
  let pricingRuleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test users
    await createTestUsers();

    // Seed test data
    await seedTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.pricingRule.deleteMany({
      where: {
        OR: [
          { bedrooms: 10 }, // Test pricing rules
        ],
      },
    });
    await prisma.service.deleteMany({
      where: {
        name: { contains: 'Test' },
      },
    });
    await app.close();
  });

  async function createTestUsers() {
    // Create admin user
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607666666' });

    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607666666',
        code: '123456',
        firstName: 'Admin',
        lastName: 'Services',
      });

    await prisma.user.update({
      where: { id: adminResponse.body.user.id },
      data: { role: 'ADMIN' },
    });

    // Get fresh admin token
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607666666' });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607666666',
        code: '123456',
      });

    adminToken = adminLoginResponse.body.accessToken;

    // Create customer user
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607777777' });

    const customerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607777777',
        code: '123456',
        firstName: 'Customer',
        lastName: 'Services',
      });

    customerToken = customerResponse.body.accessToken;
  }

  async function seedTestData() {
    // Create a test service
    const service = await prisma.service.create({
      data: {
        type: ServiceType.HOME,
        name: 'Test Home Service',
        description: 'Test service for E2E tests',
        isActive: true,
      },
    });
    serviceId = service.id;

    // Create test pricing rules
    await prisma.pricingRule.create({
      data: {
        serviceType: ServiceType.HOME,
        frequency: null,
        bedrooms: 2,
        bathrooms: 2,
        price: 250,
        isActive: true,
      },
    });

    await prisma.pricingRule.create({
      data: {
        serviceType: ServiceType.HOME,
        frequency: SubscriptionFrequency.ONCE_A_WEEK,
        bedrooms: 3,
        bathrooms: 2,
        price: 300,
        isActive: true,
      },
    });

    await prisma.pricingRule.create({
      data: {
        serviceType: ServiceType.OFFICE,
        frequency: null,
        officeSize: 'Medium',
        floors: 1,
        rooms: 5,
        bathrooms: 2,
        price: 400,
        isActive: true,
      },
    });

    // Create a test promo code
    await prisma.promotionalCode.upsert({
      where: { code: 'TEST10' },
      update: {},
      create: {
        code: 'TEST10',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        usageLimitPerUser: 1,
        totalUsageLimit: 100,
        currentUsage: 0,
        applicableServices: [ServiceType.HOME],
        minPurchaseAmount: 100,
        isActive: true,
        createdBy: '00000000-0000-0000-0000-000000000000',
      },
    });
  }

  describe('Public Endpoints (No Auth Required)', () => {
    describe('GET /api/v1/services', () => {
      it('should return all active services', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/services')
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('type');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0].isActive).toBe(true);
      });
    });

    describe('GET /api/v1/services/:id', () => {
      it('should return a specific service', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/services/${serviceId}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: serviceId,
          type: ServiceType.HOME,
          name: 'Test Home Service',
          isActive: true,
        });
      });

      it('should return 404 for non-existent service', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/services/00000000-0000-0000-0000-000000000000')
          .expect(404);
      });
    });

    describe('POST /api/v1/services/quote', () => {
      it('should calculate quote for home one-time cleaning', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/services/quote')
          .send({
            serviceType: ServiceType.HOME,
            bedrooms: 2,
            bathrooms: 2,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          serviceType: ServiceType.HOME,
          frequency: 'ONE_TIME',
          parameters: {
            bedrooms: 2,
            bathrooms: 2,
          },
          pricing: {
            basePrice: 250,
            discount: 0,
            finalPrice: 250,
            currency: 'MVR',
          },
        });
      });

      it('should calculate quote for home weekly subscription', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/services/quote')
          .send({
            serviceType: ServiceType.HOME,
            bedrooms: 3,
            bathrooms: 2,
            frequency: SubscriptionFrequency.ONCE_A_WEEK,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          serviceType: ServiceType.HOME,
          frequency: SubscriptionFrequency.ONCE_A_WEEK,
          pricing: {
            basePrice: 300,
            finalPrice: 300,
          },
        });
      });

      it('should calculate quote for office cleaning', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/services/quote')
          .send({
            serviceType: ServiceType.OFFICE,
            officeSize: 'Medium',
            floors: 1,
            rooms: 5,
            bathrooms: 2,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          serviceType: ServiceType.OFFICE,
          pricing: {
            basePrice: 400,
            finalPrice: 400,
          },
        });
      });

      it('should apply promo code discount', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/services/quote')
          .send({
            serviceType: ServiceType.HOME,
            bedrooms: 2,
            bathrooms: 2,
            promoCode: 'TEST10',
          })
          .expect(200);

        expect(response.body.pricing).toMatchObject({
          basePrice: 250,
          discount: 25,
          finalPrice: 225,
        });
        expect(response.body.promoCode).toMatchObject({
          code: 'TEST10',
          discountType: 'PERCENTAGE',
          discountValue: 10,
        });
      });

      it('should fail with invalid promo code', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/services/quote')
          .send({
            serviceType: ServiceType.HOME,
            bedrooms: 2,
            bathrooms: 2,
            promoCode: 'INVALID',
          })
          .expect(400);

        expect(response.body.message).toContain('Invalid promo code');
      });

      it('should fail when bedrooms missing for HOME service', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/services/quote')
          .send({
            serviceType: ServiceType.HOME,
            bathrooms: 2,
          })
          .expect(400);

        expect(response.body.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining('bedrooms'),
          ]),
        );
      });

      it('should fail when officeSize missing for OFFICE service', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/services/quote')
          .send({
            serviceType: ServiceType.OFFICE,
            floors: 1,
          })
          .expect(400);

        expect(response.body.message).toEqual(
          expect.arrayContaining([
            expect.stringContaining('officeSize'),
          ]),
        );
      });

      it('should return 404 when no pricing rule found', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/services/quote')
          .send({
            serviceType: ServiceType.HOME,
            bedrooms: 100, // No pricing rule for 100 bedrooms
            bathrooms: 1,
          })
          .expect(404);

        expect(response.body.message).toContain('No pricing rule found');
      });
    });
  });

  describe('Admin Service Endpoints (ADMIN only)', () => {
    describe('POST /api/v1/admin/services', () => {
      it('should create a new service', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/admin/services')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            type: ServiceType.OFFICE,
            name: 'Test Office Service E2E',
            description: 'Created in E2E test',
          })
          .expect(201);

        expect(response.body).toMatchObject({
          type: ServiceType.OFFICE,
          name: 'Test Office Service E2E',
          isActive: true,
        });
      });

      it('should fail without admin role', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/admin/services')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            type: ServiceType.HOME,
            name: 'Unauthorized Service',
          })
          .expect(403);
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/admin/services')
          .send({
            type: ServiceType.HOME,
            name: 'Unauthenticated Service',
          })
          .expect(401);
      });
    });

    describe('GET /api/v1/admin/services', () => {
      it('should return all services including inactive', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/admin/services')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should fail without admin role', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/admin/services')
          .set('Authorization', `Bearer ${customerToken}`)
          .expect(403);
      });
    });

    describe('PUT /api/v1/admin/services/:id', () => {
      it('should update a service', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/v1/admin/services/${serviceId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Test Service',
            isActive: false,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          id: serviceId,
          name: 'Updated Test Service',
          isActive: false,
        });
      });

      it('should fail for non-existent service', async () => {
        await request(app.getHttpServer())
          .put('/api/v1/admin/services/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Updated' })
          .expect(404);
      });
    });

    describe('DELETE /api/v1/admin/services/:id', () => {
      it('should delete a service', async () => {
        // Create a service to delete
        const createResponse = await request(app.getHttpServer())
          .post('/api/v1/admin/services')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            type: ServiceType.HOME,
            name: 'Service To Delete',
          })
          .expect(201);

        const response = await request(app.getHttpServer())
          .delete(`/api/v1/admin/services/${createResponse.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.message).toContain('deleted');

        // Verify deletion
        await request(app.getHttpServer())
          .get(`/api/v1/admin/services/${createResponse.body.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });

  describe('Admin Pricing Endpoints (ADMIN only)', () => {
    describe('POST /api/v1/admin/services/pricing', () => {
      it('should create a new pricing rule', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/admin/services/pricing')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            serviceType: ServiceType.HOME,
            bedrooms: 10,
            bathrooms: 5,
            price: 1000,
          })
          .expect(201);

        expect(response.body).toMatchObject({
          serviceType: ServiceType.HOME,
          bedrooms: 10,
          bathrooms: 5,
          price: '1000',
          isActive: true,
        });

        pricingRuleId = response.body.id;
      });

      it('should fail to create duplicate pricing rule', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/admin/services/pricing')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            serviceType: ServiceType.HOME,
            bedrooms: 10,
            bathrooms: 5,
            price: 1000,
          })
          .expect(409);

        expect(response.body.message).toContain('already exists');
      });

      it('should fail without admin role', async () => {
        await request(app.getHttpServer())
          .post('/api/v1/admin/services/pricing')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({
            serviceType: ServiceType.HOME,
            bedrooms: 6,
            price: 600,
          })
          .expect(403);
      });
    });

    describe('GET /api/v1/admin/services/pricing/list', () => {
      it('should return all pricing rules', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/admin/services/pricing/list')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should filter pricing rules by service type', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/admin/services/pricing/list?serviceType=HOME')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((rule: any) => {
          expect(rule.serviceType).toBe(ServiceType.HOME);
        });
      });
    });

    describe('GET /api/v1/admin/services/pricing/:id', () => {
      it('should return a specific pricing rule', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/admin/services/pricing/${pricingRuleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          id: pricingRuleId,
          serviceType: ServiceType.HOME,
          bedrooms: 10,
        });
      });

      it('should return 404 for non-existent pricing rule', async () => {
        await request(app.getHttpServer())
          .get('/api/v1/admin/services/pricing/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('PUT /api/v1/admin/services/pricing/:id', () => {
      it('should update a pricing rule', async () => {
        const response = await request(app.getHttpServer())
          .put(`/api/v1/admin/services/pricing/${pricingRuleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            price: 1100,
          })
          .expect(200);

        expect(response.body).toMatchObject({
          id: pricingRuleId,
          price: '1100',
        });
      });
    });

    describe('DELETE /api/v1/admin/services/pricing/:id', () => {
      it('should delete a pricing rule', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/api/v1/admin/services/pricing/${pricingRuleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.message).toContain('deleted');

        // Verify deletion
        await request(app.getHttpServer())
          .get(`/api/v1/admin/services/pricing/${pricingRuleId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });
});
