/**
 * ShareFooter.jsx — URL sharing and reset
 *
 * Compact footer with:
 * - Read-only URL display + Copy Link
 * - Clear All (reset to empty state)
 * - Toast feedback on copy actions
 */

import { useState, useCallback } from 'react'
import { CopySmIcon } from '../assets/icons'

export default function ShareFooter() {
  const [toast, setToast] = useState('')

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
          <CopySmIcon />
        </button>
      </div>

      {/* Toast notification */}
      {toast && <div className="toast">{toast}</div>}
    </footer>
  )
}
