import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  const mockOtpCode = '1234'; // Mock OTP code for testing

  // Helper function to generate unique phone numbers
  const generatePhoneNumber = () => {
    // Maldivian numbers must start with 7 or 9
    const firstDigit = Math.random() < 0.5 ? '7' : '9';
    const remainingDigits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `+960${firstDigit}${remainingDigits}`;
  };

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/send-otp', () => {
    it('should send OTP successfully with valid phone number', () => {
      const phoneNumber = generatePhoneNumber();
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail with invalid phone number format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber: '123456' })
        .expect(400);
    });

    it('should fail with missing phone number', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/verify-otp', () => {
    it('should verify OTP and register new user successfully', async () => {
      const phoneNumber = generatePhoneNumber();

      // Send OTP first
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber });

      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: mockOtpCode,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('phoneNumber', phoneNumber);
          expect(res.body.user).toHaveProperty('firstName', 'Test');
          expect(res.body.user).toHaveProperty('lastName', 'User');
          expect(res.body.user).toHaveProperty('role', 'CUSTOMER');
        });
    });

    it('should login existing user successfully', async () => {
      const phoneNumber = generatePhoneNumber();

      // Send OTP and register user
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber });

      await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: mockOtpCode,
          firstName: 'Test',
          lastName: 'User',
        });

      // Send OTP again for login
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber });

      // Login with same phone number (no need for firstName/lastName)
      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: mockOtpCode,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.phoneNumber).toBe(phoneNumber);
        });
    });

    it('should fail with invalid OTP code', async () => {
      const phoneNumber = generatePhoneNumber();

      // Send OTP first
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber });

      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: '0000', // Wrong code
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(401);
    });

    it('should fail with invalid phone number format', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber: '123456', // Invalid format
          code: mockOtpCode,
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should fail with missing required fields for new user', async () => {
      const phoneNumber = generatePhoneNumber();

      // Send OTP first
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber });

      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: mockOtpCode,
          // Missing firstName and lastName for new user
        })
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token successfully', async () => {
      const phoneNumber = generatePhoneNumber();

      // Register user and get tokens
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: mockOtpCode,
          firstName: 'Test',
          lastName: 'User',
        });

      const { refreshToken } = authResponse.body;

      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should fail with missing refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const phoneNumber = generatePhoneNumber();

      // Register user and get tokens
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: mockOtpCode,
          firstName: 'Test',
          lastName: 'User',
        });

      const { accessToken, refreshToken } = authResponse.body;

      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Logged out successfully');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(401);
    });

    it('should not allow using refresh token after logout', async () => {
      const phoneNumber = generatePhoneNumber();

      // Register user and get tokens
      await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber });

      const authResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: mockOtpCode,
          firstName: 'Test',
          lastName: 'User',
        });

      const { accessToken, refreshToken } = authResponse.body;

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Try to use the revoked refresh token
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const phoneNumber = generatePhoneNumber();

      // Step 1: Send OTP
      const sendOtpResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ phoneNumber })
        .expect(200);

      expect(sendOtpResponse.body.success).toBe(true);

      // Step 2: Verify OTP and register
      const verifyResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({
          phoneNumber,
          code: mockOtpCode,
          firstName: 'Flow',
          lastName: 'Test',
          email: 'flow@example.com',
        })
        .expect(200);

      expect(verifyResponse.body).toHaveProperty('accessToken');
      expect(verifyResponse.body).toHaveProperty('refreshToken');
      expect(verifyResponse.body.user.phoneNumber).toBe(phoneNumber);

      const { accessToken: token1, refreshToken: refresh1 } = verifyResponse.body;

      // Step 3: Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refresh1 })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('accessToken');
      expect(refreshResponse.body).toHaveProperty('refreshToken');

      const { accessToken: token2, refreshToken: refresh2 } = refreshResponse.body;

      // Step 4: Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token2}`)
        .send({ refreshToken: refresh2 })
        .expect(200);

      // Step 5: Verify token is revoked
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: refresh2 })
        .expect(401);
    });
  });
});
