/**
 * ChartCopyButton.jsx — Copy chart as image button
 *
 * Shows a copy icon below the gear button in the top-right of the chart.
 * On click, exports the chart container as PNG to clipboard.
 * Hides the gear + copy buttons during export for a clean image.
 * Shows a toast notification on success/failure.
 */
import { useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { CopyIcon } from '../assets/icons'

export default function ChartCopyButton({ chartRef }) {
  const [exporting, setExporting] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(''), 2500)
  }, [])

  const handleCopyImage = useCallback(async () => {
    if (!chartRef?.current) {
      showToast('No chart to export')
      return
    }
    if (exporting) return

    setExporting(true)

    // 1. Hide gear button + popover and the copy button itself
    const gearBtn = chartRef.current.querySelector('.chart-settings-btn')
    const gearPopover = chartRef.current.querySelector('.chart-settings-popover')
    const copyBtn = chartRef.current.querySelector('.chart-copy-btn')
    if (gearBtn) gearBtn.style.display = 'none'
    if (gearPopover) gearPopover.style.display = 'none'
    if (copyBtn) copyBtn.style.display = 'none'

    // 2. Wait for paint
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    try {
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
      // 3. Restore all hidden elements
      if (gearBtn) gearBtn.style.display = ''
      if (gearPopover) gearPopover.style.display = ''
      if (copyBtn) copyBtn.style.display = ''

      setExporting(false)
    }
  }, [chartRef, showToast, exporting])

  return (
    <>
      <button
        className="chart-copy-btn"
        onClick={handleCopyImage}
        disabled={exporting}
        title="Copy chart as image"
        aria-label="Copy chart as image"
      >
        <CopyIcon />
      </button>
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}
