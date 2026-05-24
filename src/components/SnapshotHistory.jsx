/**
 * SnapshotHistory.jsx — Session-only list of recent URL snapshots
 *
 * Shows the last 10 URL states generated during the session.
 * Each snapshot displays:
 * - Date/time of the change
 * - Open in new tab button
 * - Copy URL button
 * - Restore button (with Yes/No confirmation dialog)
 *
 * Data lives only in React state — lost on page close.
 */
import { useState, useCallback } from 'react'

export default function SnapshotHistory({ snapshots, onRestore, onClearHistory }) {
  const [confirmIndex, setConfirmIndex] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)

  const handleRestoreClick = useCallback((index) => {
    if (confirmIndex === index) {
      onRestore(index)
      setConfirmIndex(null)
    } else {
      setConfirmIndex(index)
    }
  }, [confirmIndex, onRestore])

  const handleCancel = useCallback(() => {
    setConfirmIndex(null)
  }, [])

  const handleCopyUrl = useCallback(async (index) => {
    try {
      await navigator.clipboard.writeText(snapshots[index].url)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      // silent fail
    }
  }, [snapshots])

  if (snapshots.length === 0) {
    return (
      <p className="snapshot-empty">No snapshots yet. Changes you make will appear here.</p>
    )
  }

  return (
    <div className="snapshot-list">
      <div className="snapshot-list-header">
        <span className="snapshot-count">{snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}</span>
        <button
          className="snapshot-btn-clear"
          onClick={onClearHistory}
          title="Clear snapshot history"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 3.5H12L11.25 11.5H2.75L2 3.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
            <path d="M4.5 3.5V2H9.5V3.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M5.5 6V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M8.5 6V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Clear
        </button>
      </div>
      {snapshots.map((snap, i) => (
        <div key={i} className="snapshot-row">
          <div className="snapshot-info">
            <span className="snapshot-time">{snap.time}</span>
            <span className="snapshot-title">{snap.url}</span>
          </div>
          <div className="snapshot-actions">
            <a
              className="snapshot-btn snapshot-btn-open"
              href={snap.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open snapshot in new tab"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H11C11.5523 12 12 11.5523 12 11V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 2H12V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 2L6.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </a>
            <button
              className={`snapshot-btn snapshot-btn-copy${copiedIndex === i ? ' snapshot-btn-copied' : ''}`}
              onClick={() => handleCopyUrl(i)}
              title="Copy snapshot URL"
            >
              {copiedIndex === i ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 7.5L5.5 10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.5 1.5H3.5C2.94772 1.5 2.5 1.94772 2.5 2.5V9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M4.5 4.5H10.5C11.0523 4.5 11.5 4.94772 11.5 5.5V11.5C11.5 12.0523 11.0523 12.5 10.5 12.5H4.5C3.94772 12.5 3.5 12.0523 3.5 11.5V5.5C3.5 4.94772 3.94772 4.5 4.5 4.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <div className="snapshot-restore-wrapper">
              <button
                className="snapshot-btn snapshot-btn-restore"
                onClick={() => handleRestoreClick(i)}
                title="Restore this snapshot"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 7C2 4.23858 4.23858 2 7 2C9.156 2 10.991 3.326 11.721 5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M12 2.5V5.2H9.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7C12 9.76142 9.76142 12 7 12C4.844 12 3.009 10.674 2.279 8.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M2 11.5V8.8H4.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {confirmIndex === i && (
                <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                  <span>Restore?</span>
                  <button className="confirm-yes" onClick={() => { onRestore(i); setConfirmIndex(null) }}>Yes</button>
                  <button className="confirm-no" onClick={handleCancel}>No</button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
