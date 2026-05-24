/**
 * ChartSettings.jsx — Gear button popover for chart line type configuration
 *
 * Shows a small gear icon in the top-right of the chart.
 * On click, opens a popover with type selectors for Scope and Completed lines:
 * - linear (smooth interpolation)
 * - stepAfter (step function, hold value until next point)
 */
import { useState, useRef, useEffect, useCallback } from 'react'

const LINE_TYPES = [
  { value: 'linear', label: 'Linear', desc: 'Smooth line' },
  { value: 'stepAfter', label: 'Step', desc: 'Step function' },
]

export default function ChartSettings({ chartConfig, onChartConfigChange }) {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef(null)
  const buttonRef = useRef(null)

  const handleClickOutside = useCallback((e) => {
    if (
      popoverRef.current && !popoverRef.current.contains(e.target) &&
      buttonRef.current && !buttonRef.current.contains(e.target)
    ) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClickOutside])

  return (
    <div className="chart-settings">
      <button
        ref={buttonRef}
        className={`chart-settings-btn${open ? ' chart-settings-btn-active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="Chart settings"
        aria-label="Chart settings"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.5 2L9.5 2L10 4L12 5L14 4L15.5 6L14 7.5L14 9.5L15.5 11L14 13L12 12L10 13L9.5 15L6.5 15L6 13L4 12L2 13L0.5 11L2 9.5L2 7.5L0.5 6L2 4L4 5L6 4L6.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
          <circle cx="8" cy="8.5" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
        </svg>
      </button>
      {open && (
        <div className="chart-settings-popover" ref={popoverRef}>
          <div className="chart-settings-section">
            <span className="chart-settings-label">
              <span className="chart-settings-dot chart-settings-dot-scope" />
              Scope
            </span>
            <div className="chart-settings-options">
              {LINE_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`chart-settings-opt${chartConfig.scopeType === t.value ? ' chart-settings-opt-active' : ''}`}
                  onClick={() => { onChartConfigChange('scopeType', t.value) }}
                  title={t.desc}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-settings-section">
            <span className="chart-settings-label">
              <span className="chart-settings-dot chart-settings-dot-completed" />
              Completed
            </span>
            <div className="chart-settings-options">
              {LINE_TYPES.map((t) => (
                <button
                  key={t.value}
                  className={`chart-settings-opt${chartConfig.completedType === t.value ? ' chart-settings-opt-active' : ''}`}
                  onClick={() => { onChartConfigChange('completedType', t.value) }}
                  title={t.desc}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
