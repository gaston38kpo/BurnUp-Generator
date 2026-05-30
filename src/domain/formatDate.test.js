import { describe, it, expect } from 'vitest'
import { formatDate } from './formatDate'

describe('formatDate', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
    expect(formatDate(undefined)).toBe('')
  })

  it('formats a valid ISO date string', () => {
    const result = formatDate('2026-05-27')
    // We can't hardcode the locale-specific output, so check the structure
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
    // Should contain the year
    expect(result).toContain('2026')
  })

  it('formats date with leading zeros', () => {
    const result = formatDate('2026-01-05')
    expect(result).toContain('2026')
    expect(result.length).toBeGreaterThan(0)
  })
})
