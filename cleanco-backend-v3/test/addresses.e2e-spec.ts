import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('AddressesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;
  let customerId: string;
  let addressId1: string;
  let addressId2: string;

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

    // Clean up test data - only delete specific test users
    await prisma.address.deleteMany({
      where: {
        user: {
          phoneNumber: {
            in: ['+9607333333', '+9607444444'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        phoneNumber: {
          in: ['+9607333333', '+9607444444'],
        },
      },
    });

    // Create test users
    await createTestUsers();
  });

  afterAll(async () => {
    // Clean up - only delete specific test users
    await prisma.address.deleteMany({
      where: {
        user: {
          phoneNumber: {
            in: ['+9607333333', '+9607444444'],
          },
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        phoneNumber: {
          in: ['+9607333333', '+9607444444'],
        },
      },
    });
    await app.close();
  });

  async function createTestUsers() {
    // Create customer user
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607333333' });

    const customerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607333333',
        code: '123456',
        firstName: 'Customer',
        lastName: 'Address',
      });

    customerToken = customerResponse.body.accessToken;
    customerId = customerResponse.body.user.id;

    // Create admin user
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607444444' });

    const adminResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607444444',
        code: '123456',
        firstName: 'Admin',
        lastName: 'User',
      });

    // Make this user an admin
    await prisma.user.update({
      where: { id: adminResponse.body.user.id },
      data: { role: 'ADMIN' },
    });

    // Get fresh admin token
    await request(app.getHttpServer())
      .post('/api/v1/auth/send-otp')
      .send({ phoneNumber: '+9607444444' });

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-otp')
      .send({
        phoneNumber: '+9607444444',
        code: '123456',
      });

    adminToken = adminLoginResponse.body.accessToken;
  }

  describe('POST /api/v1/addresses', () => {
    it('should create first address as primary', async () => {
      const createDto = {
        streetAddress: 'Majeedhee Magu',
        city: 'Male',
        island: 'Male',
        label: 'Home',
        postalCode: '20000',
        latitude: 4.1755,
        longitude: 73.5093,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        streetAddress: createDto.streetAddress,
        city: createDto.city,
        island: createDto.island,
        label: createDto.label,
        postalCode: createDto.postalCode,
        latitude: createDto.latitude,
        longitude: createDto.longitude,
        isPrimary: true,
        userId: customerId,
      });

      addressId1 = response.body.id;
    });

    it('should create second address as non-primary', async () => {
      const createDto = {
        streetAddress: 'Sosun Magu',
        city: 'Hulhumale',
        island: 'Hulhumale',
        label: 'Work',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        streetAddress: createDto.streetAddress,
        city: createDto.city,
        island: createDto.island,
        label: createDto.label,
        isPrimary: false,
        userId: customerId,
      });

      addressId2 = response.body.id;
    });

    it('should fail to create address without required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ label: 'Test' })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('streetAddress'),
        ]),
      );
    });

    it('should fail to create address without authentication', async () => {
      const createDto = {
        streetAddress: 'Test Address',
        city: 'Male',
        island: 'Male',
      };

      await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .send(createDto)
        .expect(401);
    });
  });

  describe('GET /api/v1/addresses', () => {
    it('should return all addresses for the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].isPrimary).toBe(true);
      expect(response.body[0].userId).toBe(customerId);
    });

    it('should return empty array for user with no addresses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/addresses')
        .expect(401);
    });
  });

  describe('GET /api/v1/addresses/:id', () => {
    it('should return a specific address', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: addressId1,
        streetAddress: 'Majeedhee Magu',
        city: 'Male',
        island: 'Male',
        userId: customerId,
      });
    });

    it('should fail to get address owned by another user', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should fail to get non-existent address', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/addresses/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/addresses/${addressId1}`)
        .expect(401);
    });
  });

  describe('PUT /api/v1/addresses/:id', () => {
    it('should update an address', async () => {
      const updateDto = {
        label: 'Home Updated',
        streetAddress: 'Majeedhee Magu Updated',
        postalCode: '20001',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        id: addressId1,
        label: updateDto.label,
        streetAddress: updateDto.streetAddress,
        postalCode: updateDto.postalCode,
      });
    });

    it('should fail to update address owned by another user', async () => {
      const updateDto = {
        label: 'Hacked',
      };

      await request(app.getHttpServer())
        .put(`/api/v1/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(403);
    });

    it('should fail to update with invalid data', async () => {
      const updateDto = {
        latitude: 'invalid', // Should be a number
      };

      await request(app.getHttpServer())
        .put(`/api/v1/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateDto)
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/addresses/${addressId1}`)
        .send({ label: 'Test' })
        .expect(401);
    });
  });

  describe('PUT /api/v1/addresses/:id/primary', () => {
    it('should set an address as primary', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/addresses/${addressId2}/primary`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.id).toBe(addressId2);
      expect(response.body.isPrimary).toBe(true);

      // Verify the change
      const addresses = await request(app.getHttpServer())
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const primaryAddress = addresses.body.find((a: any) => a.isPrimary);
      expect(primaryAddress.id).toBe(addressId2);
    });

    it('should fail to set address owned by another user as primary', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/addresses/${addressId1}/primary`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/addresses/${addressId1}/primary`)
        .expect(401);
    });
  });

  describe('DELETE /api/v1/addresses/:id', () => {
    it('should delete a non-primary address', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted');

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/v1/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });

    it('should delete primary address and reassign primary to next address', async () => {
      // Create a new address first
      const createDto = {
        streetAddress: 'New Address',
        city: 'Male',
        island: 'Male',
      };

      const newAddress = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(createDto)
        .expect(201);

      // addressId2 is currently primary, delete it
      await request(app.getHttpServer())
        .delete(`/api/v1/addresses/${addressId2}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      // Verify the new address is now primary
      const addresses = await request(app.getHttpServer())
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(addresses.body).toHaveLength(1);
      expect(addresses.body[0].id).toBe(newAddress.body.id);
      expect(addresses.body[0].isPrimary).toBe(true);
    });

    it('should fail to delete address owned by another user', async () => {
      // Create an address for admin
      const createDto = {
        streetAddress: 'Admin Address',
        city: 'Male',
        island: 'Male',
      };

      const adminAddress = await request(app.getHttpServer())
        .post('/api/v1/addresses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDto)
        .expect(201);

      // Try to delete with customer token
      await request(app.getHttpServer())
        .delete(`/api/v1/addresses/${adminAddress.body.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/addresses/00000000-0000-0000-0000-000000000000')
        .expect(401);
    });
  });

  describe('Authorization checks', () => {
    it('should not allow users to see addresses of other users', async () => {
      // Get customer's addresses with admin token
      const addresses = await request(app.getHttpServer())
        .get('/api/v1/addresses')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Admin should only see their own addresses (1 address)
      expect(addresses.body).toHaveLength(1);
      expect(addresses.body[0].userId).not.toBe(customerId);
    });
  });
});
