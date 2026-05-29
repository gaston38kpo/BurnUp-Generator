/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  base: '/BurnUp-Generator/',
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/domain/**', 'src/components/**'],
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 80,
        lines: 90,
      },
    },
    globals: true,
    // Projects split by environment (vitest v4 removed environmentMatchGlobs)
    projects: [
      {
        extends: true,
        test: {
          name: 'lib',
          include: ['src/lib/**/*.test.{js,jsx}', 'src/domain/**/*.test.{js,jsx}'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'components',
          include: ['src/components/**/*.test.{js,jsx}', 'src/App.test.{js,jsx}'],
          environment: 'jsdom',
          setupFiles: ['./src/test-setup.js'],
        },
      },
    ],
  },
})
