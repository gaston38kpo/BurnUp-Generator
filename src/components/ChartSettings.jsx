/**
 * ChartSettings.jsx — Gear button popover for chart line type configuration
 *
 * Shows a small gear icon in the top-right of the chart.
 * On click, opens a popover with per-line settings for Scope, Completed and Ideal.
 * Changes are kept in a local draft until the user clicks "Apply",
 * so the chart only updates when the user explicitly confirms.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { GearIcon, ResetIcon } from '../assets/icons'

const LINE_TYPES = [
  { value: 'linear', label: 'Linear', desc: 'Smooth line' },
  { value: 'stepAfter', label: 'Step', desc: 'Step function' },
]

export default function ChartSettings({ chartConfig, onChartConfigChange }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(null)
  const popoverRef = useRef(null)
  const buttonRef = useRef(null)
  const chartConfigRef = useRef(chartConfig)
  useEffect(() => {
    chartConfigRef.current = chartConfig
  }, [chartConfig])

  const handleApply = useCallback(() => {
    if (draft) {
      const current = chartConfigRef.current
      const hasChanges = Object.keys(draft).some(key => draft[key] !== current[key])
      if (hasChanges) {
        onChartConfigChange(draft)
      }
    }
    setOpen(false)
    setDraft(null)
  }, [draft, onChartConfigChange])

  const handleCancel = useCallback(() => {
    setOpen(false)
    setDraft(null)
  }, [])

  const handleClickOutside = useCallback((e) => {
    if (
      popoverRef.current && !popoverRef.current.contains(e.target) &&
      buttonRef.current && !buttonRef.current.contains(e.target)
    ) {
      handleCancel()
    }
  }, [handleCancel])

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, handleClickOutside])

  // Local draft mutator — does NOT call onChartConfigChange
  const setDraftValue = useCallback((key, value) => {
    setDraft((prev) => prev ? { ...prev, [key]: value } : prev)
  }, [])

  // If draft is null (shouldn't happen while open), fall back to chartConfig
  const config = draft || chartConfig

  const togglePopover = useCallback(() => {
    setOpen((prev) => {
      if (prev) {
        // Closing — discard draft
        setDraft(null)
        return false
      }
      // Opening — snapshot current config into draft
      setDraft({ ...chartConfigRef.current })
      return true
    })
  }, [])

  return (
    <div className="chart-settings">
      <button
        ref={buttonRef}
        className={`chart-settings-btn${open ? ' chart-settings-btn-active' : ''}`}
        onClick={togglePopover}
        title="Chart settings"
        aria-label="Chart settings"
      >
      <GearIcon />
      </button>
      {open && (
        <div className="chart-settings-popover" ref={popoverRef}>
          <LineConfig
            label="Scope"
            dotClass="chart-settings-dot-scope"
            typeKey="scopeType"
            fillKey="scopeFill"
            colorKey="scopeColor"
            defaultColor="#75AADB"
            config={config}
            onChange={setDraftValue}
          />
          <LineConfig
            label="Completed"
            dotClass="chart-settings-dot-completed"
            typeKey="completedType"
            fillKey="completedFill"
            colorKey="completedColor"
            defaultColor="#FCBF49"
            config={config}
            onChange={setDraftValue}
          />
           <IdealConfig
              colorKey="idealColor"
              config={config}
              onChange={setDraftValue}
            />
            <div className="chart-settings-section">
              <span className="chart-settings-label">Trend Line</span>
              <div className="chart-settings-row">
                 <button
                   className={`chart-settings-opt${config.showTrendLine ? ' chart-settings-opt-active' : ''}`}
                   onClick={() => setDraftValue('showTrendLine', !config.showTrendLine)}
                   title="Show a linear regression trend line based on completed work"
                 >
                   {config.showTrendLine ? 'Enabled' : 'Disabled'}
                 </button>
              </div>
            </div>
           <div className="chart-settings-actions">
            <button
              className="chart-settings-cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="chart-settings-apply"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LineConfig({ label, dotClass, typeKey, fillKey, colorKey, defaultColor, config, onChange }) {
  const colorValue = config[colorKey] || defaultColor
  const colorInputRef = useRef(null)

  return (
    <div className="chart-settings-section">
      <span className="chart-settings-label">
        <span className={`chart-settings-dot ${dotClass}`} />
        {label}
      </span>
      <div className="chart-settings-row">
        <div className="chart-settings-options">
          {LINE_TYPES.map((t) => (
            <button
              key={t.value}
              className={`chart-settings-opt${config[typeKey] === t.value ? ' chart-settings-opt-active' : ''}`}
              onClick={() => onChange(typeKey, t.value)}
              title={t.desc}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          className={`chart-settings-fill${config[fillKey] !== false ? ' chart-settings-fill-on' : ''}`}
          onClick={() => onChange(fillKey, config[fillKey] === false)}
          title={config[fillKey] !== false ? 'Hide area fill' : 'Show area fill'}
          aria-label={config[fillKey] !== false ? 'Area fill on' : 'Area fill off'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12L5 6L8 9L11 4L14 8V12H2Z" fill="currentColor" opacity={config[fillKey] !== false ? 0.4 : 0.1}/>
            <path d="M2 12L5 6L8 9L11 4L14 8" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>
        <button
          className="chart-settings-color-swatch"
          onClick={() => colorInputRef.current?.click()}
          title="Change color"
          aria-label={`Change ${label} color`}
          style={{ backgroundColor: colorValue }}
        >
          <input
            ref={colorInputRef}
            type="color"
            value={colorValue}
            onChange={(e) => onChange(colorKey, e.target.value)}
            aria-label={`${label} color picker`}
          />
        </button>
        {colorValue !== defaultColor && (
          <button
            className="chart-settings-color-reset"
            onClick={() => onChange(colorKey, defaultColor)}
            title="Reset to default color"
aria-label={`Reset ${label} color`}
>
<ResetIcon />
</button>
        )}
      </div>
    </div>
  )
}

function IdealConfig({ colorKey, config, onChange }) {
  const computedDefault = typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue('--ideal').trim()
    : '#000000'
  const colorValue = config[colorKey] || computedDefault
  const isCustom = !!config[colorKey]
  const colorInputRef = useRef(null)

  return (
    <div className="chart-settings-section">
      <span className="chart-settings-label">
        <span className="chart-settings-dot chart-settings-dot-ideal" />
        Ideal
      </span>
      <div className="chart-settings-row">
        <button
          className="chart-settings-color-swatch"
          onClick={() => colorInputRef.current?.click()}
          title="Change color"
          aria-label="Change Ideal color"
          style={{ backgroundColor: colorValue }}
        >
          <input
            ref={colorInputRef}
            type="color"
            value={colorValue}
            onChange={(e) => onChange(colorKey, e.target.value)}
            aria-label="Ideal color picker"
          />
        </button>
        {isCustom && (
          <button
            className="chart-settings-color-reset"
            onClick={() => onChange(colorKey, '')}
            title="Reset to default color"
aria-label="Reset Ideal color"
>
<ResetIcon />
</button>
        )}
      </div>
    </div>
  )
}
