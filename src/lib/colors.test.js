import { describe, it, expect } from 'vitest'
import { hexToRgb, cssVarOverrides } from './colors'

// ─── hexToRgb ─────────────────────────────────────────────────────────────────

describe('hexToRgb', () => {
  it('parses 6-character hex with hash', () => {
    const result = hexToRgb('#FF5733')
    expect(result).toEqual({ r: 255, g: 87, b: 51 })
  })

  it('parses 6-character hex without hash', () => {
    const result = hexToRgb('75AADB')
    expect(result).toEqual({ r: 117, g: 170, b: 219 })
  })

  it('parses black', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('parses white', () => {
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
  })

  it('parses accent indigo', () => {
    const result = hexToRgb('#6366f1')
    expect(result.r).toBe(99)
    expect(result.g).toBe(102)
    expect(result.b).toBe(241)
  })
})

// ─── cssVarOverrides ──────────────────────────────────────────────────────────

describe('cssVarOverrides', () => {
  it('generates CSS with scope and completed colors', () => {
    const css = cssVarOverrides('#75AADB', '#FCBF49', '')

    expect(css).toContain('--scope: #75AADB')
    expect(css).toContain('--completed: #FCBF49')
    expect(css).toContain('--scope-bg: rgba(117, 170, 219, 0.08)')
    expect(css).toContain('--completed-bg: rgba(252, 191, 73, 0.08)')
  })

  it('includes ideal color when provided', () => {
    const css = cssVarOverrides('#75AADB', '#FCBF49', '#000000')

    expect(css).toContain('--ideal: #000000')
    expect(css).toContain('--ideal-bg: rgba(0, 0, 0, 0.08)')
  })

  it('omits ideal color when empty string', () => {
    const css = cssVarOverrides('#75AADB', '#FCBF49', '')

    expect(css).not.toContain('--ideal')
  })

  it('includes dark mode overrides for scope and completed', () => {
    const css = cssVarOverrides('#75AADB', '#FCBF49', '')

    expect(css).toContain('@media (prefers-color-scheme: dark)')
    expect(css).toContain('--scope-bg: rgba(117, 170, 219, 0.1)')
    expect(css).toContain('--completed-bg: rgba(252, 191, 73, 0.1)')
  })

  it('includes ideal in dark mode when provided', () => {
    const css = cssVarOverrides('#75AADB', '#FCBF49', '#FFFFFF')

    // Light mode line
    expect(css).toContain('--ideal: #FFFFFF')
    expect(css).toContain('--ideal-bg: rgba(255, 255, 255, 0.08)')
    // Dark mode line
    expect(css).toContain('--ideal-bg: rgba(255, 255, 255, 0.1)')
  })

  it('generates valid CSS with :root selector', () => {
    const css = cssVarOverrides('#75AADB', '#FCBF49', '')

    expect(css).toMatch(/^:root {/)
    expect(css).toContain('}')
  })
})
