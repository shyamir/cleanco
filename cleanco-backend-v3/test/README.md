# Authentication E2E Tests

This directory contains end-to-end tests for the Cleanco backend authentication system.

## Prerequisites

Before running the tests, ensure:

1. **Docker services are running**:
   ```bash
   docker-compose up -d
   ```

2. **Environment is set to use Mock OTP**:
   In your `.env` file, set:
   ```
   USE_MOCK_OTP=true
   ```
   This ensures tests run without sending real SMS messages.

3. **Database is migrated**:
   ```bash
   npx prisma migrate dev
   ```

## Running Tests

### Run all e2e tests:
```bash
npm run test:e2e
```

### Run only authentication tests:
```bash
npm run test:e2e -- auth.e2e-spec
```

### Run tests with coverage:
```bash
npm run test:e2e -- --coverage
```

### Run tests in watch mode:
```bash
npm run test:e2e -- --watch
```

## Test Coverage

The authentication e2e test suite covers:

### 1. **Send OTP Endpoint** (`POST /api/v1/auth/send-otp`)
- ✅ Send OTP with valid phone number
- ✅ Fail with invalid phone number format
- ✅ Fail with missing phone number

### 2. **Verify OTP Endpoint** (`POST /api/v1/auth/verify-otp`)
- ✅ Verify OTP and register new user
- ✅ Login existing user
- ✅ Fail with invalid OTP code
- ✅ Fail with invalid phone number
- ✅ Fail with missing required fields

### 3. **Refresh Token Endpoint** (`POST /api/v1/auth/refresh`)
- ✅ Refresh access token successfully
- ✅ Fail with invalid refresh token
- ✅ Fail with missing refresh token

### 4. **Logout Endpoint** (`POST /api/v1/auth/logout`)
- ✅ Logout successfully
- ✅ Fail without authentication
- ✅ Verify token is revoked after logout

### 5. **Complete Authentication Flow**
- ✅ Full flow: Send OTP → Verify → Refresh → Logout

## Test Data

The tests use mock data:
- **Mock OTP Code**: `123456`
- **Test Phone Numbers**: Various Maldivian phone numbers (+960...)
- **Test Users**: Automatically created and cleaned up

## Database Cleanup

Tests create temporary users in the database. For a clean state, you can:

1. **Reset database** (destroys all data):
   ```bash
   npx prisma migrate reset
   ```

2. **Manually clean test users** (if needed):
   ```bash
   npx prisma studio
   # Then delete users with test phone numbers
   ```

## Troubleshooting

### Tests failing with "Connection refused"
- Ensure Docker containers are running: `docker-compose up -d`
- Check PostgreSQL is accessible on port 5433

### Tests failing with "OTP verification failed"
- Ensure `USE_MOCK_OTP=true` in `.env`
- Restart the dev server to pick up environment changes

### Tests timing out
- Increase Jest timeout in `test/jest-e2e.json`:
  ```json
  {
    "testTimeout": 30000
  }
  ```

## Writing Additional Tests

To add more authentication tests:

1. Open `test/auth.e2e-spec.ts`
2. Add new `describe` or `it` blocks
3. Follow the existing pattern:
   ```typescript
   it('should do something', () => {
     return request(app.getHttpServer())
       .post('/api/v1/auth/endpoint')
       .send({ data })
       .expect(expectedStatus)
       .expect((res) => {
         expect(res.body).toHaveProperty('field');
       });
   });
   ```

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run E2E Tests
  run: |
    docker-compose up -d
    npm run test:e2e
  env:
    USE_MOCK_OTP: true
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Next Steps

After authentication tests pass:
1. Run tests before each deployment
2. Add more test suites for other modules (bookings, payments, etc.)
3. Set up automated testing in CI/CD pipeline
4. Monitor test coverage and aim for >80%
