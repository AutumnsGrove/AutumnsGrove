import '@testing-library/jest-dom';
import { beforeAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

beforeAll(() => {
  // Setup code runs before all tests
});

afterEach(() => {
  // Cleanup after each test
  cleanup();
});
