import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)), sky: fileURLToPath(new URL('./sky.html', import.meta.url)) } } },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
