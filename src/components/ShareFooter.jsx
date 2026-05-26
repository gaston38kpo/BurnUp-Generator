/**
 * ShareFooter.jsx — URL sharing and reset
 *
 * Compact footer with:
 * - Read-only URL display + Copy Link
 * - Clear All (reset to empty state)
 * - Toast feedback on copy actions
 */

import { useState, useCallback } from 'react'
import { CheckSquareIcon, TrashIcon } from '../assets/icons'

export default function ShareFooter({ onClear }) {
  const [toast, setToast] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

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
          <CheckSquareIcon />
          <span>Copy Link</span>
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
