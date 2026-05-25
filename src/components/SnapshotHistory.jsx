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
import { TrashSmIcon, ExternalLinkIcon, CheckIcon, CopyIcon, RefreshIcon } from '../assets/icons'

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
        <TrashSmIcon />
        Clear
        </button>
      </div>
  {snapshots.map((snap, i) => (
    <div key={i} className="snapshot-row">
      <div className="snapshot-info">
        <span className="snapshot-title">{snap.title || 'Untitled'}</span>
        <span className="snapshot-time">{snap.time}</span>
      </div>
      <div className="snapshot-actions">
        <a
          className="snapshot-btn snapshot-btn-open"
          href={snap.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open snapshot in new tab"
        >
          <ExternalLinkIcon />
        </a>
        <button
          className={`snapshot-btn snapshot-btn-copy${copiedIndex === i ? ' snapshot-btn-copied' : ''}`}
          onClick={() => handleCopyUrl(i)}
          title="Copy snapshot URL"
        >
          {copiedIndex === i ? (
            <CheckIcon />
          ) : (
            <CopyIcon />
          )}
        </button>
        <div className="snapshot-restore-wrapper">
          <button
            className="snapshot-btn snapshot-btn-restore"
            onClick={() => handleRestoreClick(i)}
            title="Restore this snapshot"
          >
          <RefreshIcon />
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
