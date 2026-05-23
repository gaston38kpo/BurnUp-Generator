/**
 * DataTable.jsx — Interactive data entry table with entry template form
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  Table (sorted newest-first, color-coded by type)    │
 *   │  ┌────────┬──────────┬────────┬──────┬────┐         │
 *   │  │ Date   │ Type     │ Value  │ Cum. │ ✕  │         │
 *   │  └────────┴──────────┴────────┴──────┴────┘         │
 *   ├─────────────────────────────────────────────────────┤
 *   │  Entry Template (mini-form)                         │
 *   │  ┌────────┬──────────┬────────┬──────────┐         │
 *   │  │ Date   │ Type     │ Value  │ + Add    │         │
 *   │  └────────┴──────────┴────────┴──────────┘         │
 *   └─────────────────────────────────────────────────────┘
 */

import { useState, useCallback, useRef, useMemo } from 'react'
import dayjs from 'dayjs'

export default function DataTable({
  entries,
  fechaInicio,
  fechaFin,
  onEntryChange,
  onEntryDelete,
  onEntryAdd,
}) {
  const minDate = fechaInicio || undefined
  const maxDate = fechaFin || undefined

  // ─── Template form state ────────────────────────────────────────────────
  const [tplFecha, setTplFecha] = useState(() => fechaInicio || dayjs().format('YYYY-MM-DD'))
  const [tplTipo, setTplTipo] = useState('Scope')
  const [tplValor, setTplValor] = useState('')
  const valorInputRef = useRef(null)

  const handleTplDateChange = useCallback((value) => {
    let clamped = value
    if (minDate && value < minDate) clamped = minDate
    if (maxDate && value > maxDate) clamped = maxDate
    setTplFecha(clamped)
  }, [minDate, maxDate])

  const handleAdd = useCallback(() => {
    const valor = tplValor === '' ? 0 : Number(tplValor)
    onEntryAdd(tplFecha, tplTipo, valor)
    setTplValor('')
    valorInputRef.current?.focus()
  }, [tplFecha, tplTipo, tplValor, onEntryAdd])

  const handleValorKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }, [handleAdd])

  // ─── Table row handlers ─────────────────────────────────────────────────
  const handleDateChange = useCallback(
    (originalIndex, value) => {
      let clamped = value
      if (minDate && value < minDate) clamped = minDate
      if (maxDate && value > maxDate) clamped = maxDate
      onEntryChange(originalIndex, 'fecha', clamped)
    },
    [minDate, maxDate, onEntryChange]
  )

  // ─── Compute running cumulative totals for the preview column ──────────
  const cumulatives = useMemo(() => {
    const sorted = [...entries].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.tipo === 'Completed' ? 1 : 0) - (b.tipo === 'Completed' ? 1 : 0))
    const result = new Map()
    let scopeTotal = 0
    let completedTotal = 0

    for (const entry of sorted) {
      const val = Number(entry.valor) || 0
      if (entry.tipo === 'Scope') scopeTotal += val
      else completedTotal += val
      result.set(entry.originalIndex, entry.tipo === 'Scope' ? scopeTotal : completedTotal)
    }
    return result
  }, [entries])

  const isScope = (tipo) => tipo === 'Scope'

  return (
    <div className="data-table-container">
      <h2 className="section-title">Data Entries</h2>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <div className="empty-table">
          <svg className="empty-table-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="12" width="56" height="40" rx="6" stroke="var(--border)" strokeWidth="2" fill="none"/>
            <line x1="4" y1="24" x2="60" y2="24" stroke="var(--border)" strokeWidth="1.5"/>
            <line x1="4" y1="36" x2="60" y2="36" stroke="var(--border)" strokeWidth="1.5"/>
            <line x1="24" y1="24" x2="24" y2="52" stroke="var(--border)" strokeWidth="1.5"/>
            <line x1="44" y1="24" x2="44" y2="52" stroke="var(--border)" strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="12" fill="var(--accent)" opacity="0.9"/>
            <line x1="46" y1="50" x2="54" y2="50" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <line x1="50" y1="46" x2="50" y2="54" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p className="empty-table-msg">No entries yet</p>
          <p className="empty-table-hint">Use the form below to add your first data point</p>
        </div>
      ) : null}

      <div className={`entry-template ${isScope(tplTipo) ? 'tpl-scope' : 'tpl-completed'}`}>
        <div className="tpl-type-row">
          <button
            type="button"
            className={`tpl-type-tab ${isScope(tplTipo) ? 'tpl-type-tab-active' : ''}`}
            onClick={() => setTplTipo('Scope')}
          >
            <span className="tpl-type-dot tpl-type-dot-scope" />
            Scope
          </button>
          <button
            type="button"
            className={`tpl-type-tab ${!isScope(tplTipo) ? 'tpl-type-tab-active' : ''}`}
            onClick={() => setTplTipo('Completed')}
          >
            <span className="tpl-type-dot tpl-type-dot-completed" />
            Completed
          </button>
        </div>
        <div className="tpl-fields-row">
          <div className="tpl-field">
            <span className="tpl-label">Date</span>
            <input
              type="date"
              className="input-date"
              value={tplFecha}
              min={minDate}
              max={maxDate}
              onChange={(e) => handleTplDateChange(e.target.value)}
              aria-label="New entry date"
            />
          </div>
          <div className="tpl-field">
            <span className="tpl-label">Points</span>
            <input
              ref={valorInputRef}
              type="number"
              className="input-value tpl-value-input"
              value={tplValor}
              min="1"
              step="1"
              placeholder="0"
              onChange={(e) => setTplValor(e.target.value === '' ? '' : Number(e.target.value))}
              onKeyDown={handleValorKeyDown}
              aria-label="New entry value"
            />
          </div>
          <button
            className="btn-add-entry"
            onClick={handleAdd}
            title="Add entry"
            aria-label="Add entry"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add
          </button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-date">Date</th>
                <th className="col-type">Type</th>
                <th className="col-value">Value</th>
                <th className="col-cum">Amount</th>
                <th className="col-action"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const scoped = isScope(entry.tipo)
                const typeClass = scoped ? 'row-scope' : 'row-completed'
                const cumVal = cumulatives.get(entry.originalIndex) ?? 0

                return (
                  <tr
                    key={entry.originalIndex}
                    className={typeClass}
                  >
                    <td className="col-date">
                      <input
                        type="date"
                        className="input-date"
                        value={entry.fecha}
                        min={minDate}
                        max={maxDate}
                        onChange={(e) => handleDateChange(entry.originalIndex, e.target.value)}
                        aria-label="Entry date"
                      />
                    </td>
                    <td className="col-type">
                      <button
                        type="button"
                        className={`type-pill ${scoped ? 'type-pill-scope' : 'type-pill-completed'}`}
                        onClick={() => onEntryChange(entry.originalIndex, 'tipo', scoped ? 'Completed' : 'Scope')}
                        title={`Click to switch to ${scoped ? 'Completed' : 'Scope'}`}
                        aria-label={`Entry type: ${entry.tipo}. Click to toggle.`}
                      >
                        <span className="type-pill-dot" />
                        {entry.tipo}
                      </button>
                    </td>
                    <td className="col-value">
                      <input
                        type="number"
                        className="input-value"
                        value={entry.valor}
                        min="0"
                        step="1"
                        placeholder="0"
                        onChange={(e) =>
                          onEntryChange(entry.originalIndex, 'valor', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        aria-label="Entry value"
                      />
                    </td>
                    <td className="col-cum">
                      <span className={`cum-badge ${scoped ? 'cum-badge-scope' : 'cum-badge-completed'}`}>
                        {cumVal}
                      </span>
                    </td>
                    <td className="col-action">
                      <button
                        className="btn-delete"
                        onClick={() => onEntryDelete(entry.originalIndex)}
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
