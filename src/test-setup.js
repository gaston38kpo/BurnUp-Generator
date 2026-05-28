/**
 * test-setup.js — Global setup for component tests
 *
 * Imports jest-dom matchers and mocks browser APIs unavailable in jsdom.
 * Guarded for node environment — browser-specific setup only runs in jsdom.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Auto-cleanup between tests (vitest projects don't always trigger auto-cleanup)
afterEach(() => {
  cleanup()
})

// Module-level mocks — vitest hoists these regardless of environment.
// The html-to-image mock is unused by lib tests (safe in node).
vi.mock('html-to-image', () => ({
  toPng: vi.fn(() =>
    Promise.resolve(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    ),
  ),
}))

// Browser-specific setup — guarded for node environment
const isBrowser =
  typeof document !== 'undefined' && typeof window !== 'undefined'

if (isBrowser) {
  // Mock clipboard API
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      write: vi.fn(() => Promise.resolve()),
      writeText: vi.fn(() => Promise.resolve()),
    },
    configurable: true,
  })

  // Shim ClipboardItem if not available in jsdom
  if (typeof globalThis.ClipboardItem === 'undefined') {
    globalThis.ClipboardItem = class ClipboardItem {
      constructor(items) {
        this.items = items
      }
    }
  }

  // Mock execCommand fallback
  document.execCommand = vi.fn(() => true)

  // Mock matchMedia (required by Recharts/ChartSettings)
  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn(() => ({ matches: false })),
    configurable: true,
  })
}
