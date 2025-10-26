# Testing Guide

This directory contains comprehensive unit tests for the Device Events Service.

## Test Structure

```
tests/
├── setup.ts                 # Test configuration and environment setup
├── app.test.ts             # Integration tests for the main application
├── types.test.ts           # Tests for TypeScript type definitions
├── db/
│   └── client.test.ts      # Database client unit tests
├── routes/
│   └── events.test.ts      # API routes unit tests
└── utils/
    └── test-helpers.ts     # Test utilities and mock data helpers
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
# Run only database tests
npm test -- tests/db/

# Run only route tests
npm test -- tests/routes/

# Run only type tests
npm test -- tests/types.test.ts
```

## Test Configuration

The tests are configured using Jest with the following setup:

- **Test Environment**: Node.js
- **TypeScript Support**: ts-jest preset
- **Coverage**: HTML, LCOV, and text reports
- **Timeout**: 10 seconds per test
- **Setup File**: `tests/setup.ts` for environment configuration

## Test Categories

### 1. Unit Tests

#### Database Client (`tests/db/client.test.ts`)
- Tests database connection configuration
- Tests query execution and error handling
- Tests connection pooling and cleanup
- Mocks PostgreSQL client

#### API Routes (`tests/routes/events.test.ts`)
- Tests POST /api/events endpoint
  - Valid event creation
  - Input validation
  - Error handling
- Tests GET /api/events endpoint
  - Query filtering by device_id, event_type, time range
  - Pagination handling
  - Response formatting

### 2. Integration Tests

#### Main Application (`tests/app.test.ts`)
- Tests health check endpoint
- Tests middleware functionality
- Tests 404 error handling
- Tests request logging

### 3. Type Tests

#### Type Definitions (`tests/types.test.ts`)
- Tests TypeScript interface compliance
- Tests optional field handling
- Tests type compatibility between interfaces

## Test Utilities

The `tests/utils/test-helpers.ts` file provides:

- **TestHelpers class**: Utility methods for creating mock data
- **TestData object**: Common test data and scenarios
- **Mock creation helpers**: For Express requests/responses and database results

### Example Usage

```typescript
import { TestHelpers, TestData } from './utils/test-helpers';

// Create mock event
const mockEvent = TestHelpers.createMockDeviceEvent({
  device_id: 'custom-device',
  event_type: 'custom-event'
});

// Create mock request
const mockRequest = TestHelpers.createMockRequest(
  TestData.validEvent,
  { limit: '50' }
);

// Create mock database result
const mockResult = TestHelpers.createMockQueryResult([mockEvent], 1);
```

## Mocking Strategy

### Database Mocking
- All database interactions are mocked using Jest
- Database client is mocked at the module level
- Query results are controlled for predictable testing

### Express App Mocking
- Routes are tested in isolation using supertest
- Middleware is tested through integration tests
- Request/response objects are mocked for unit tests

## Coverage Goals

The test suite aims for:
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## Environment Variables

Tests use the following environment variables (set in `tests/setup.ts`):

```env
NODE_ENV=test
DB_NAME=device_events_test
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
```

## Best Practices

1. **Test Isolation**: Each test is independent and doesn't rely on other tests
2. **Mock External Dependencies**: Database, file system, and network calls are mocked
3. **Descriptive Test Names**: Test names clearly describe what is being tested
4. **Arrange-Act-Assert**: Tests follow the AAA pattern for clarity
5. **Edge Case Coverage**: Tests cover both happy path and error scenarios
6. **Type Safety**: All test code is fully typed with TypeScript

## Adding New Tests

When adding new tests:

1. Create test files with `.test.ts` extension
2. Use descriptive test suite and test names
3. Follow the existing mocking patterns
4. Add tests to the appropriate category (unit/integration)
5. Update this README if adding new test utilities or patterns

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="should create a new event successfully"
```

### Debug Mode
```bash
npm test -- --detectOpenHandles --forceExit
```

### Verbose Output
```bash
npm test -- --verbose
```

