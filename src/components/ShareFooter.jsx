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
import { CheckSquareIcon, ImageIcon, TrashIcon } from '../assets/icons'

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
        <CheckSquareIcon />
        <span>Copy Link</span>
      </button>
      <button
        className="btn-icon"
        onClick={handleCopyImage}
        disabled={exporting}
        title="Copy chart as image"
      >
        <ImageIcon />
        <span>Copy Image</span>
      </button>
        <div className="clear-wrapper">
          <button className="btn-icon btn-icon-danger" onClick={() => setConfirmClear(true)} title="Clear all data">
        <TrashIcon />
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
