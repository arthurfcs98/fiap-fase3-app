import { TestApp, DatabaseCleaner } from './helpers';

beforeAll(async () => {
  // Double-check we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `E2E tests must run with NODE_ENV=test. Current: ${process.env.NODE_ENV}`,
    );
  }

  // Initialize app (this will create admin user via onModuleInit)
  await TestApp.getInstance();
}, 30000);

afterAll(async () => {
  const app = await TestApp.getInstance();

  // Clean database after all tests (with safety checks)
  await DatabaseCleaner.clean(app);

  await TestApp.close();
});
