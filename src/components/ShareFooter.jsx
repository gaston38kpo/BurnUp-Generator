/**
 * ShareFooter.jsx — URL sharing, chart image export, and reset
 *
 * Compact footer with:
 * - Read-only URL display + Copy Link
 * - Copy Image (Light) — chart on white background
 * - Copy Image (Dark) — chart on dark background
 * - Clear All (reset to empty state)
 * - Toast feedback on copy actions
 */

import { useState, useCallback } from 'react'
import { toPng } from 'html-to-image'

/** Light-theme CSS variable overrides for export */
const LIGHT_VARS = {
  '--bg': '#ffffff',
  '--bg-alt': '#f9fafb',
  '--bg-elevated': '#ffffff',
  '--border': '#e5e7eb',
  '--text': '#6b7280',
  '--text-h': '#111827',
  '--text-dim': '#9ca3af',
  '--accent': '#6366f1',
  '--ideal': '#000000',
}

/** Dark-theme CSS variable overrides for export */
const DARK_VARS = {
  '--bg': '#0c0d12',
  '--bg-alt': '#14151d',
  '--bg-elevated': '#1a1b25',
  '--border': '#262836',
  '--text': '#9ca3af',
  '--text-h': '#f3f4f6',
  '--text-dim': '#6b7280',
  '--accent': '#75AADB',
  '--ideal': '#FFFFFF',
}

function applyVars(vars) {
  const root = document.documentElement
  const prev = {}
  for (const [key, value] of Object.entries(vars)) {
    prev[key] = root.style.getPropertyValue(key)
    root.style.setProperty(key, value)
  }
  return prev
}

function restoreVars(prev) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(prev)) {
    if (value === '') {
      root.style.removeProperty(key)
    } else {
      root.style.setProperty(key, value)
    }
  }
}

export default function ShareFooter({ chartRef, onClear }) {
  const [toast, setToast] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const [exporting, setExporting] = useState(false)

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(''), 2500)
  }, [])

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      showToast('Link copied!')
    } catch {
      const input = document.querySelector('.share-url-input')
      if (input) {
        input.select()
        document.execCommand('copy')
        showToast('Link copied!')
      }
    }
  }, [currentUrl, showToast])

  const handleCopyImage = useCallback(async (theme) => {
    if (!chartRef?.current) {
      showToast('No chart to export')
      return
    }
    if (exporting) return

    setExporting(true)

    // 1. Hide the gear button
    const gearBtn = chartRef.current.querySelector('.chart-settings-btn')
    const gearPopover = chartRef.current.querySelector('.chart-settings-popover')
    if (gearBtn) gearBtn.style.display = 'none'
    if (gearPopover) gearPopover.style.display = 'none'

    // 2. Force the theme
    const vars = theme === 'dark' ? DARK_VARS : LIGHT_VARS
    const prevVars = applyVars(vars)

    // 3. Wait for paint
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    try {
      const bgColor = vars['--bg']
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: bgColor,
        pixelRatio: 2,
      })

      const response = await fetch(dataUrl)
      const blob = await response.blob()

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])

      showToast(`Chart copied (${theme} mode)!`)
    } catch {
      showToast('Image copy not supported')
    } finally {
      // 4. Restore theme
      restoreVars(prevVars)

      // 5. Restore gear button
      if (gearBtn) gearBtn.style.display = ''
      if (gearPopover) gearPopover.style.display = ''

      setExporting(false)
    }
  }, [chartRef, showToast, exporting])

  return (
    <footer className="share-footer">
      <div className="share-row">
        <input
          type="text"
          className="share-url-input"
          value={currentUrl}
          readOnly
          onClick={(e) => e.target.select()}
          aria-label="Shareable URL"
        />
        <button className="btn-icon" onClick={handleCopyUrl} title="Copy shareable link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 8.5L7.5 10L10.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 6C2 3.79 3.79 2 6 2H10C12.21 2 14 3.79 14 6V10C14 12.21 12.21 14 10 14H6C3.79 14 2 12.21 2 10V6Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span>Copy Link</span>
        </button>
        <button
          className="btn-icon btn-icon-light"
          onClick={() => handleCopyImage('light')}
          disabled={exporting}
          title="Copy chart as image (light theme)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M8 2C6.5 3.5 5.5 5.5 5.5 8C5.5 10.5 6.5 12.5 8 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none"/>
            <path d="M8 2C9.5 3.5 10.5 5.5 10.5 8C10.5 10.5 9.5 12.5 8 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none"/>
            <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1"/>
          </svg>
          <span>Copy Light</span>
        </button>
        <button
          className="btn-icon btn-icon-dark"
          onClick={() => handleCopyImage('dark')}
          disabled={exporting}
          title="Copy chart as image (dark theme)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 8.5C14 4.91 11.09 2 7.5 2C3.91 2 1 4.91 1 8.5C1 12.09 3.91 15 7.5 15C8.97 15 10.33 14.53 11.44 13.73C9.35 13.22 7.8 11.35 7.8 9.1C7.8 6.56 9.86 4.5 12.4 4.5C13.08 4.5 13.72 4.65 14.3 4.91C14.05 4.24 13.56 3.47 13.15 3C13.67 3.68 14 4.55 14 5.5V8.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
          </svg>
          <span>Copy Dark</span>
        </button>
        <div className="clear-wrapper">
          <button className="btn-icon btn-icon-danger" onClick={() => setConfirmClear(true)} title="Clear all data">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 4H13L12 13H4L3 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
              <path d="M5 4V2.5H11V4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M6.5 6.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9.5 6.5V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Clear</span>
          </button>
          {confirmClear && (
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <span>Clear all data?</span>
              <button className="confirm-yes" onClick={() => { onClear(); setConfirmClear(false) }}>Yes</button>
              <button className="confirm-no" onClick={() => setConfirmClear(false)}>No</button>
            </div>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}
    </footer>
  )
}
