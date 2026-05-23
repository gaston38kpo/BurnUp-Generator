/**
 * ShareFooter.jsx — URL sharing and chart image export
 *
 * Contains:
 *   - A read-only input showing the current URL with the compressed token
 *   - A "Copy Link" button
 *   - A "Copy as Image" button that captures the chart as a PNG to clipboard
 */

import { useState, useCallback } from 'react'
import { toPng } from 'html-to-image'

export default function ShareFooter({ chartRef }) {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedImg, setCopiedImg] = useState(false)
  const [imgError, setImgError] = useState('')

  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.querySelector('.share-url-input')
      if (input) {
        input.select()
        document.execCommand('copy')
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      }
    }
  }, [currentUrl])

  const handleCopyImage = useCallback(async () => {
    setImgError('')
    if (!chartRef?.current) {
      setImgError('Chart not found')
      return
    }

    try {
      const dataUrl = await toPng(chartRef.current, {
        backgroundColor: getComputedStyle(document.documentElement)
          .getPropertyValue('--bg')
          .trim() || '#ffffff',
        pixelRatio: 2, // crisp export on retina
      })

      // Convert data URL to blob for clipboard
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])

      setCopiedImg(true)
      setTimeout(() => setCopiedImg(false), 2000)
    } catch (e) {
      console.error('Image copy failed:', e)
      setImgError('Image copy not supported in this browser')
    }
  }, [chartRef])

  return (
    <footer className="share-footer">
      <h2 className="section-title">Share</h2>

      <div className="share-row">
        <input
          type="text"
          className="share-url-input"
          value={currentUrl}
          readOnly
          aria-label="Shareable URL"
        />
        <button
          className="btn-share"
          onClick={handleCopyUrl}
          title="Copy shareable link"
        >
          {copiedUrl ? '✓ Copied!' : 'Copy Link'}
        </button>
      </div>

      <div className="share-row">
        <button
          className="btn-share btn-share-image"
          onClick={handleCopyImage}
          title="Copy chart as PNG image"
        >
          {copiedImg ? '✓ Image Copied!' : 'Copy as Image'}
        </button>
        {imgError && <span className="share-error">{imgError}</span>}
      </div>
    </footer>
  )
}
