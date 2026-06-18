import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'html'],
    include: ['src/services/**/*.ts'],
    exclude: ['src/index.ts', 'src/**/*.d.ts'],
    thresholds: {
      lines: 60,
    },
  },
  },
});
