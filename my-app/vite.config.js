import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// repo root (one level above my-app), resolved from this file's location
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', //check port again later
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    root: repoRoot,
    environment: 'jsdom',
    globals: true,
    include: ['test/frontend-tests/**/*.test.{js,jsx}'],
    setupFiles: [fileURLToPath(new URL('../test/frontend-tests/setup.js', import.meta.url))],
  },
});
