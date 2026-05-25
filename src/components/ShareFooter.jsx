/**
 * ShareFooter.jsx — URL sharing, chart image export, and reset
 *
 * Compact footer with:
 * - Read-only URL display + Copy Link
 * - Copy Image — chart exported as-is (no theme forcing)
 * - Clear All (reset to empty state)
 * - Toast feedback on copy actions
 */

import { useState, useCallback } from 'react'
import { toPng } from 'html-to-image'

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

  const handleCopyImage = useCallback(async () => {
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

    // 2. Wait for paint
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    try {
      // Capture chart as-is with transparent background
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: null,
        pixelRatio: 2,
      })

      const response = await fetch(dataUrl)
      const blob = await response.blob()

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])

      showToast('Chart copied!')
    } catch {
      showToast('Image copy not supported')
    } finally {
      // 3. Restore gear button
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
        className="btn-icon"
        onClick={handleCopyImage}
        disabled={exporting}
        title="Copy chart as image"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
          <path d="M2 11L5.5 7.5L8 10L10.5 7L14 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Copy Image</span>
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
