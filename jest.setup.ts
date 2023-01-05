import { server } from './mocks/server';
// Establish API mocking before all tests.

import './src/fetch-polyfill.ts';

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
