/**
 * DataTable.jsx — Interactive data entry table with entry template form
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────┐
 *   │  Table (sorted, color-coded by type)             │
 *   │  ┌────────┬──────────┬────────┬────┐            │
 *   │  │ Date   │ Type     │ Value  │ ✕  │            │
 *   │  └────────┴──────────┴────────┴────┘            │
 *   ├─────────────────────────────────────────────────┤
 *   │  Entry Template (mini-form)                     │
 *   │  ┌────────┬──────────┬────────┬──────────┐     │
 *   │  │ Date   │ Type     │ Value  │ + Add    │     │
 *   │  └────────┴──────────┴────────┴──────────┘     │
 *   └─────────────────────────────────────────────────┘
 *
 * The template form is always visible below the table.
 * On "Add", the entry is committed to state and the form resets.
 */

import { useState, useCallback, useRef } from 'react'
import dayjs from 'dayjs'

const SCOPE_COLOR = '#6366f1'
const COMPLETED_COLOR = '#10b981'

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

  // Sync template date when fechaInicio changes and template still matches old value
  const handleTplDateChange = useCallback((value) => {
    let clamped = value
    if (minDate && value < minDate) clamped = minDate
    if (maxDate && value > maxDate) clamped = maxDate
    setTplFecha(clamped)
  }, [minDate, maxDate])

  const handleAdd = useCallback(() => {
    const valor = tplValor === '' ? 0 : Number(tplValor)
    onEntryAdd(tplFecha, tplTipo, valor)
    // Reset value only — keep date & type for rapid entry of similar items
    setTplValor('')
    // Focus back to value input for quick re-entry
    valorInputRef.current?.focus()
  }, [tplFecha, tplTipo, tplValor, onEntryAdd])

  // Allow Enter key in the value field to submit
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

  // ─── Type badge color ───────────────────────────────────────────────────
  const typeColor = (tipo) => tipo === 'Completed' ? COMPLETED_COLOR : SCOPE_COLOR

  return (
    <div className="data-table-container">
      <h2 className="section-title">Data Entries</h2>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {entries.length === 0 ? (
        <p className="empty-table-msg">
          No entries yet. Fill in the template below to add your first data point.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-date">Date</th>
                <th className="col-type">Type</th>
                <th className="col-value">Value</th>
                <th className="col-action"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const color = typeColor(entry.tipo)
                return (
                  <tr
                    key={entry.originalIndex}
                    className={`row-type-${entry.tipo.toLowerCase()}`}
                    style={{ borderLeft: `3px solid ${color}` }}
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
                      <span
                        className="type-badge"
                        style={{
                          '--badge-color': color,
                          '--badge-bg': `${color}15`,
                        }}
                      >
                        <select
                          className="input-type input-type-inline"
                          value={entry.tipo}
                          onChange={(e) => onEntryChange(entry.originalIndex, 'tipo', e.target.value)}
                          aria-label="Entry type"
                          style={{ color }}
                        >
                          <option value="Scope">Scope</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </span>
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
                    <td className="col-action">
                      <button
                        className="btn-delete"
                        onClick={() => onEntryDelete(entry.originalIndex)}
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Entry Template Form ────────────────────────────────────────── */}
      <div className="entry-template" style={{ borderLeft: `3px solid ${typeColor(tplTipo)}` }}>
        <input
          type="date"
          className="input-date tpl-input"
          value={tplFecha}
          min={minDate}
          max={maxDate}
          onChange={(e) => handleTplDateChange(e.target.value)}
          aria-label="New entry date"
        />
        <select
          className="input-type tpl-input"
          value={tplTipo}
          onChange={(e) => setTplTipo(e.target.value)}
          aria-label="New entry type"
          style={{ color: typeColor(tplTipo) }}
        >
          <option value="Scope">Scope</option>
          <option value="Completed">Completed</option>
        </select>
        <input
          ref={valorInputRef}
          type="number"
          className="input-value tpl-input"
          value={tplValor}
          min="0"
          step="1"
          placeholder="Value"
          onChange={(e) => setTplValor(e.target.value === '' ? '' : Number(e.target.value))}
          onKeyDown={handleValorKeyDown}
          aria-label="New entry value"
        />
        <button
          className="btn-add-entry"
          onClick={handleAdd}
          disabled={tplValor === ''}
        >
          + Add
        </button>
      </div>
    </div>
  )
}
