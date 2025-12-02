import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let customerUserId: string;
  let adminToken: string;
  let adminUserId: string;
  let anotherCustomerToken: string;
  let anotherCustomerUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as in main.ts
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

    // Clean up test data
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        phoneNumber: {
          in: ['+9607111111', '+9607222222', '+9607333333'],
        },
      },
    });

    // Create test users
    await createTestUsers();
  });

  afterAll(async () => {
    // Clean up
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        phoneNumber: {
          in: ['+9607111111', '+9607222222', '+9607333333'],
        },
      },
    });
    await app.close();
  });

  async function createTestUsers() {
    // Create customer user
    // Send OTP first
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607111111' });

    const customerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607111111',
        code: '123456',
        firstName: 'Customer',
        lastName: 'User',
      });

    customerToken = customerResponse.body.accessToken;
    customerUserId = customerResponse.body.user.id;

    // Create another customer user
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607222222' });

    const anotherCustomerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607222222',
        code: '123456',
        firstName: 'Another',
        lastName: 'Customer',
      });

    anotherCustomerToken = anotherCustomerResponse.body.accessToken;
    anotherCustomerUserId = anotherCustomerResponse.body.user.id;

    // Create admin user
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607333333' });

    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607333333',
        code: '123456',
        firstName: 'Admin',
        lastName: 'User',
      });

    const adminUser = await prisma.user.update({
      where: { id: adminResponse.body.user.id },
      data: { role: 'ADMIN' },
    });

    // Get fresh token with admin role
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607333333' });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607333333',
        code: '123456',
        firstName: 'Admin',
        lastName: 'User',
      });

    adminToken = adminLoginResponse.body.accessToken;
    adminUserId = adminUser.id;
  }

  describe('GET /users/me', () => {
    it('should get current user profile', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', customerUserId);
          expect(res.body).toHaveProperty('phoneNumber', '+9607111111');
          expect(res.body).toHaveProperty('firstName', 'Customer');
          expect(res.body).toHaveProperty('lastName', 'User');
          expect(res.body).toHaveProperty('role', 'CUSTOMER');
          expect(res.body).toHaveProperty('addresses');
          expect(Array.isArray(res.body.addresses)).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });
  });

  describe('PUT /users/me', () => {
    it('should update own profile', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name',
          email: 'customer@test.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('firstName', 'Updated');
          expect(res.body).toHaveProperty('lastName', 'Name');
          expect(res.body).toHaveProperty('email', 'customer@test.com');
        });
    });

    it('should fail with duplicate email', async () => {
      // First user sets email
      await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${anotherCustomerToken}`)
        .send({
          email: 'unique@test.com',
        });

      // Second user tries to use same email
      return request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          email: 'unique@test.com',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Email is already taken');
        });
    });

    it('should fail with invalid email format', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/me')
        .send({
          firstName: 'Test',
        })
        .expect(401);
    });
  });

  describe('GET /users/:id', () => {
    it('should get own user profile by ID', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${customerUserId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', customerUserId);
          expect(res.body).toHaveProperty('phoneNumber', '+9607111111');
          expect(res.body).toHaveProperty('addresses');
        });
    });

    it('should allow admin to view any user', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${customerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', customerUserId);
        });
    });

    it('should fail when customer tries to view another user', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${anotherCustomerUserId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('You can only view your own profile');
        });
    });

    it('should fail with non-existent user ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /users/:id', () => {
    it('should update own profile by ID', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${customerUserId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'SelfUpdated',
          lastName: 'User',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('firstName', 'SelfUpdated');
        });
    });

    it('should allow admin to update any user', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${customerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'AdminUpdated',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('firstName', 'AdminUpdated');
        });
    });

    it('should fail when customer tries to update another user', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${anotherCustomerUserId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'Unauthorized',
        })
        .expect(403);
    });
  });

  describe('GET /users (Admin Only)', () => {
    it('should list all users for admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
          expect(res.body.meta).toHaveProperty('totalPages');
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(2);
          expect(res.body.data.length).toBeLessThanOrEqual(2);
        });
    });

    it('should filter by role', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?role=ADMIN')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
          res.body.data.forEach((user: any) => {
            expect(user.role).toBe('ADMIN');
          });
        });
    });

    it('should search by name', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter by phone number', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users?phoneNumber=%2B9607333333')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(1);
          expect(res.body.data[0].phoneNumber).toBe('+9607333333');
        });
    });

    it('should fail for customer role', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toContain('Forbidden');
        });
    });
  });

  describe('PUT /users/:id/role (Admin Only)', () => {
    it('should update user role', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${anotherCustomerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'CLEANER',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('role', 'CLEANER');
        });
    });

    it('should fail with invalid role', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${anotherCustomerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'INVALID_ROLE',
        })
        .expect(400);
    });

    it('should fail for customer role', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${anotherCustomerUserId}/role`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          role: 'ADMIN',
        })
        .expect(403);
    });
  });

  describe('DELETE /users/:id (Admin Only)', () => {
    it('should deactivate user', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${anotherCustomerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('deactivated successfully');
          expect(res.body.user.isActive).toBe(false);
        });
    });

    it('should fail for customer role', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${anotherCustomerUserId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /users/:id/activate (Admin Only)', () => {
    it('should activate user', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${anotherCustomerUserId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('activated successfully');
          expect(res.body.user.isActive).toBe(true);
        });
    });

    it('should fail for customer role', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${anotherCustomerUserId}/activate`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/00000000-0000-0000-0000-000000000000/activate')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Complete User Management Flow', () => {
    it('should complete full user management workflow', async () => {
      // 1. Customer views own profile
      const profileResponse = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('id');
      const userId = profileResponse.body.id;

      // 2. Customer updates own profile
      await request(app.getHttpServer())
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          firstName: 'Workflow',
          lastName: 'Test',
          email: 'workflow@test.com',
        })
        .expect(200);

      // 3. Admin lists all users
      const listResponse = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(listResponse.body.data.length).toBeGreaterThan(0);

      // 4. Admin views specific user
      await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 5. Admin updates user role
      await request(app.getHttpServer())
        .put(`/api/v1/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'CLEANER',
        })
        .expect(200);

      // 6. Admin deactivates user
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 7. Admin reactivates user
      await request(app.getHttpServer())
        .put(`/api/v1/users/${userId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
