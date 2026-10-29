import { defineConfig } from 'vitest/config';

// Separate from vite.config.mts, whose root is the webview folder and would hide the
// tests that live next to the extension code.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
