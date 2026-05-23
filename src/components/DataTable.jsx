/**
 * DataTable.jsx — Interactive data entry table for burnup records
 *
 * Each row contains:
 *   - Date input (type="date")
 *   - Type selector (Scope | Completed)
 *   - Value input (numeric)
 *   - Delete button
 *
 * Plus an "Add New Entry" button at the bottom.
 */

import { useCallback } from 'react'

export default function DataTable({
  entries,
  newEntryId,
  fechaInicio,
  fechaFin,
  onEntryChange,
  onEntryDelete,
  onEntryAdd,
}) {
  const minDate = fechaInicio || undefined
  const maxDate = fechaFin || undefined

  const handleDateChange = useCallback(
    (originalIndex, value) => {
      // Clamp the date to the [fechaInicio, fechaFin] range
      let clamped = value
      if (minDate && value < minDate) clamped = minDate
      if (maxDate && value > maxDate) clamped = maxDate
      onEntryChange(originalIndex, 'fecha', clamped)
    },
    [minDate, maxDate, onEntryChange]
  )

  return (
    <div className="data-table-container">
      <h2 className="section-title">Data Entries</h2>

      {entries.length === 0 ? (
        <p className="empty-table-msg">
          No entries yet. Click the button below to add your first data point.
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
        {entries.map((entry) => (
          <tr key={entry.originalIndex} className={entry.id === newEntryId ? 'row-new' : ''}>
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
              <select
                className="input-type"
                value={entry.tipo}
                onChange={(e) => onEntryChange(entry.originalIndex, 'tipo', e.target.value)}
                aria-label="Entry type"
              >
                <option value="Scope">Scope</option>
                <option value="Completed">Completed</option>
              </select>
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
        ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="btn-add-entry" onClick={onEntryAdd}>
        + Add New Entry
      </button>
    </div>
  )
}
