/**
 * DataTable.jsx — Interactive data entry table with entry template form
 *
 * Layout:
 * ┌───────────────────────────────────────────────────────────────┐
 * │ Table (sorted by sprint order, color-coded by type)          │
 * │ ┌──────────┬──────────┬───────────┬────────┬──────┬────┐     │
 * │ │ Sprint   │ Type     │ Mode+Val  │ Cum.   │ ✕   │     │
 * │ └──────────┴──────────┴───────────┴────────┴──────┴────┘     │
 * ├───────────────────────────────────────────────────────────────┤
 * │ Entry Template (mini-form)                                   │
 * │ ┌──────────┬──────────┬───────────┬────────┬──────────┐      │
 * │ │ Sprint   │ Type     │ Mode+Val  │ + Add  │          │      │
 * │ └──────────┴──────────┴───────────┴────────┴──────────┘      │
 * └───────────────────────────────────────────────────────────────┘
 */

import { useState, useCallback, useRef, useMemo, useEffect, memo } from 'react'
import { PlusIcon, CloseIcon, EmptyTableIcon } from '../assets/icons'

/**
 * EntryValueInput — local-state wrapper for existing entry value inputs.
 * Only propagates the value upstream on blur, not on every keystroke.
 * This prevents URL regeneration and history push while typing.
 */
function EntryValueInput({ value, entryId, onEntryChange }) {
  const [local, setLocal] = useState(value)

  // Sync from external value (e.g. after undo/redo)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(value)
  }, [value])

  const commit = useCallback(() => {
    if (local !== value) {
      onEntryChange(entryId, 'valor', local === '' ? '' : Number(local))
    }
  }, [local, value, entryId, onEntryChange])

  return (
    <input
      type="number"
      className="input-value"
      value={local}
      step="any"
      placeholder="0"
      onChange={(e) => setLocal(e.target.value === '' ? '' : Number(e.target.value))}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
      aria-label="Entry value"
    />
  )
}

const DataTable = memo(function DataTable({
  sprints,
  entries,
  sprintMap,
  onEntryChange,
  onEntryDelete,
  onEntryAdd,
}) {
  const [tplSprintId, setTplSprintId] = useState(
    () => sprints.length > 0 ? sprints[0].id : ''
  )
  const [tplTipo, setTplTipo] = useState('Completed')
  const [tplValor, setTplValor] = useState('')
  const [tplMode, setTplMode] = useState('relative')
  const [filterType, setFilterType] = useState('all')
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const valorInputRef = useRef(null)

  const handleAdd = useCallback(() => {
    if (!tplSprintId) return
    const valor = tplValor === '' ? 0 : Number(tplValor)
    onEntryAdd(tplSprintId, tplTipo, valor, tplMode)
    setTplValor('')
    valorInputRef.current?.focus()
  }, [tplSprintId, tplTipo, tplValor, tplMode, onEntryAdd])

  const handleValorKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }, [handleAdd])

  const displayEntries = useMemo(() => {
    const sprintIndexMap = new Map(sprints.map((s, i) => [s.id, i]))
    return entries
      .slice()
      .sort((a, b) => {
        const ai = sprintIndexMap.get(a.sprintId) ?? -1
        const bi = sprintIndexMap.get(b.sprintId) ?? -1
        if (ai !== bi) return bi - ai
        return a.tipo === 'Scope' ? -1 : 1
      })
  }, [entries, sprints])

  const filteredEntries = useMemo(() => {
    if (filterType === 'all') return displayEntries
    return displayEntries.filter((e) => e.tipo === filterType)
  }, [displayEntries, filterType])

  const totalPages = Math.ceil(filteredEntries.length / PAGE_SIZE) || 1

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredEntries.slice(start, start + PAGE_SIZE)
  }, [filteredEntries, page])

  const pageStart = (page - 1) * PAGE_SIZE
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filteredEntries.length)

  // Reset page when filter type changes
  useEffect(() => {
    setPage(1)
  }, [filterType])

  // Clamp page when entries shrink below current offset
  useEffect(() => {
    setPage(prev => {
      const max = Math.ceil(filteredEntries.length / PAGE_SIZE) || 1
      return prev > max ? max : prev
    })
  }, [filteredEntries.length])

  const isScope = (tipo) => tipo === 'Scope'
  const hasSprints = sprints.length > 0

  const usedSprints = useMemo(() => {
    const scope = new Set()
    const completed = new Set()
    for (const e of entries) {
      if (e.tipo === 'Scope') scope.add(e.sprintId)
      else completed.add(e.sprintId)
    }
    return { Scope: scope, Completed: completed }
  }, [entries])

  const availableByTipo = useMemo(() => {
    const scope = sprints.filter((s) => !usedSprints.Scope.has(s.id))
    const completed = sprints.filter((s) => !usedSprints.Completed.has(s.id))
    return { Scope: scope, Completed: completed }
  }, [sprints, usedSprints])

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (sprints.length === 0) {
      setTplSprintId('')
      return
    }
    const available = availableByTipo[tplTipo]
    if (available.length === 0) {
      setTplSprintId('')
    } else if (!available.some((s) => s.id === tplSprintId)) {
      setTplSprintId(available[0].id)
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [sprints, tplTipo, usedSprints, availableByTipo, tplSprintId])

  const wouldToggleDuplicate = useCallback(
    (entryId, entryTipo, entrySprintId) => {
      const switchedTipo = entryTipo === 'Scope' ? 'Completed' : 'Scope'
      return entries.some(
        (e) => e.id !== entryId && e.tipo === switchedTipo && e.sprintId === entrySprintId
      )
    },
    [entries]
  )

  const tplScoped = isScope(tplTipo)
  const tplModeClass = tplScoped ? 'tpl-scope' : 'tpl-completed'

  return (
    <div>

      {/* ── Entry Template Form ────────────────────────────────────── */}
      <div className={`entry-template ${tplModeClass}`}>
        <div className="tpl-type-row">
          <button
            type="button"
            className={`tpl-type-tab ${!tplScoped ? 'tpl-type-tab-active' : ''}`}
            onClick={() => setTplTipo('Completed')}
          >
            <span className="tpl-type-dot tpl-type-dot-completed" />
            Completed
          </button>
          <button
            type="button"
            className={`tpl-type-tab ${tplScoped ? 'tpl-type-tab-active' : ''}`}
            onClick={() => setTplTipo('Scope')}
          >
            <span className="tpl-type-dot tpl-type-dot-scope" />
            Scope
          </button>
        </div>
        <div className="tpl-fields-row">
          <div className="tpl-field">
            <span className="tpl-label">Sprint</span>
            <select
              className="input-sprint"
              value={tplSprintId}
              onChange={(e) => setTplSprintId(e.target.value)}
              disabled={
                !hasSprints || availableByTipo[tplTipo].length === 0
              }
              aria-label="New entry sprint"
            >
              {(() => {
                const available = availableByTipo[tplTipo]
                return available.length > 0 ? (
                  available.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))
                ) : (
                  <option value="">All sprints used</option>
                )
              })()}
            </select>
          </div>
          <div className="tpl-field tpl-field-mode">
            <span className="tpl-label">Mode</span>
            <div className="mode-toggle">
              <button
                type="button"
                className={`mode-btn ${tplMode === 'relative' ? 'mode-btn-active' : ''} ${tplScoped ? 'mode-btn-scope' : 'mode-btn-completed'}`}
                onClick={() => setTplMode('relative')}
                title="Relative: value is a delta/increment"
              >
                ± Rel
              </button>
              <button
                type="button"
                className={`mode-btn ${tplMode === 'absolute' ? 'mode-btn-active' : ''} ${tplScoped ? 'mode-btn-scope' : 'mode-btn-completed'}`}
                onClick={() => setTplMode('absolute')}
                title="Absolute: value is the final cumulative total"
              >
                = Abs
              </button>
            </div>
          </div>
          <div className="tpl-field">
            <span className="tpl-label">Points</span>
            <input
              ref={valorInputRef}
              type="number"
              className="input-value tpl-value-input"
              value={tplValor}
              step="any"
              placeholder="0"
              onChange={(e) =>
                setTplValor(e.target.value === '' ? '' : Number(e.target.value))
              }
              onKeyDown={handleValorKeyDown}
              aria-label="New entry value"
            />
          </div>
          <button
            className="btn-add-entry"
            onClick={handleAdd}
            disabled={!tplSprintId}
            title="Add entry"
            aria-label="Add entry"
          >
            <PlusIcon />
            Add
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="empty-table">
          <EmptyTableIcon className="empty-table-icon" />
          <p className="empty-table-msg">No entries yet</p>
          <p className="empty-table-hint">
            Use the form below to add your first data point
          </p>
        </div>
      )}

      {/* ── Type Filter Bar ─────────────────────────────────────── */}
      {entries.length > 0 && (
        <div className="table-filter-bar">
          <button
            type="button"
            className={`table-filter-btn ${filterType === 'all' ? 'table-filter-btn-active' : ''}`}
            onClick={() => setFilterType('all')}
            aria-label="Show all entries"
          >
            All ({entries.length})
          </button>
          <button
            type="button"
            className={`table-filter-btn table-filter-btn-scope ${filterType === 'Scope' ? 'table-filter-btn-active' : ''}`}
            onClick={() => setFilterType('Scope')}
            aria-label="Show only Scope entries"
          >
            Scope
          </button>
          <button
            type="button"
            className={`table-filter-btn table-filter-btn-completed ${filterType === 'Completed' ? 'table-filter-btn-active' : ''}`}
            onClick={() => setFilterType('Completed')}
            aria-label="Show only Completed entries"
          >
            Completed
          </button>
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      {entries.length > 0 && filteredEntries.length > PAGE_SIZE && (
        <div className="table-pagination">
          <button
            type="button"
            className="pagination-btn"
            aria-label="Previous page"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <span className="pagination-info" role="status" aria-live="polite">
            Showing {pageStart + 1}–{pageEnd} of {filteredEntries.length} entries
          </span>
          <button
            type="button"
            className="pagination-btn"
            aria-label="Next page"
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────── */}
      {entries.length > 0 && (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-sprint">Sprint</th>
                <th className="col-type">Type</th>
                <th className="col-value">Value</th>
                <th className="col-cum">Cumulative</th>
                <th className="col-action"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.map((entry) => {
                const scoped = isScope(entry.tipo)
                const cumVal = sprintMap.get(entry.sprintId)?.[entry.tipo.toLowerCase()] ?? 0
                const switchedTipo = scoped ? 'Completed' : 'Scope'
                const isToggleDisabled = wouldToggleDuplicate(
                  entry.id,
                  entry.tipo,
                  entry.sprintId
                )
                const entryMode = entry.mode || 'relative'

                return (
                  <tr key={entry.id}>
                    <td className="col-sprint">
                      <select
                        className="input-sprint"
                        value={entry.sprintId}
                        onChange={(e) =>
                          onEntryChange(entry.id, 'sprintId', e.target.value)
                        }
                        aria-label="Entry sprint"
                      >
                        {(() => {
                          const taken = usedSprints[entry.tipo]
                          const opts = sprints.filter(
                            (s) => s.id === entry.sprintId || !taken.has(s.id)
                          )
                          return opts.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))
                        })()}
                      </select>
                    </td>
                    <td className="col-type">
                      <button
                        type="button"
                        className={`type-pill ${scoped ? 'type-pill-scope' : 'type-pill-completed'} ${isToggleDisabled ? 'type-pill-disabled' : ''}`}
                        onClick={() => {
                          if (!isToggleDisabled) {
                            onEntryChange(
                              entry.id,
                              'tipo',
                              scoped ? 'Completed' : 'Scope'
                            )
                          }
                        }}
                        disabled={isToggleDisabled}
                        title={
                          isToggleDisabled
                            ? `Cannot switch: this sprint already has a ${switchedTipo} entry`
                            : `Click to switch to ${switchedTipo}`
                        }
                        aria-label={`Entry type: ${entry.tipo}${isToggleDisabled ? ' (locked)' : '. Click to toggle.'}`}
                      >
                        <span className="type-pill-dot" />
                        {entry.tipo}
                      </button>
                    </td>
                    <td className="col-value">
                      <div className="value-cell">
                        <div className="mode-toggle mode-toggle-inline">
                          <button
                            type="button"
                            className={`mode-btn ${entryMode === 'relative' ? 'mode-btn-active' : ''} ${scoped ? 'mode-btn-scope' : 'mode-btn-completed'}`}
                            onClick={() =>
                              onEntryChange(entry.id, 'mode', 'relative')
                            }
                            title="Relative: value is a delta"
                          >
                            ±
                          </button>
                          <button
                            type="button"
                            className={`mode-btn ${entryMode === 'absolute' ? 'mode-btn-active' : ''} ${scoped ? 'mode-btn-scope' : 'mode-btn-completed'}`}
                            onClick={() =>
                              onEntryChange(entry.id, 'mode', 'absolute')
                            }
                            title="Absolute: value is the final total"
                          >
                            =
                          </button>
                        </div>
              <EntryValueInput
                value={entry.valor}
                entryId={entry.id}
                onEntryChange={onEntryChange}
              />
                      </div>
                    </td>
                    <td className="col-cum">
                      <span
                        className={`cum-badge ${scoped ? 'cum-badge-scope' : 'cum-badge-completed'}`}
                      >
                        {cumVal}
                      </span>
                    </td>
                    <td className="col-action">
                      <button
                        className="btn-delete"
                        onClick={() => onEntryDelete(entry.id)}
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
<CloseIcon />
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
})

export default DataTable
