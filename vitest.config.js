import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.env.VITE_API_BASE': JSON.stringify('/api'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./src/test-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,vue}'],
      exclude: [
        'src/**/*.spec.*',
        'src/**/*.test.*',
        'src/main.js',
        'src/router/index.js',
        'src/test-setup.js',
      ],
      // 企业级覆盖率阈值
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
      watermarks: {
        statements: [50, 80],
        functions: [50, 80],
        branches: [40, 70],
        lines: [50, 80],
      },
    },
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
