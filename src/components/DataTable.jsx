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

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'

/**
 * EntryValueInput — local-state wrapper for existing entry value inputs.
 * Only propagates the value upstream on blur, not on every keystroke.
 * This prevents URL regeneration and snapshot creation while typing.
 */
function EntryValueInput({ value, index, onEntryChange }) {
  const [local, setLocal] = useState(value)

  // Sync from external value (e.g. after snapshot restore)
  useEffect(() => {
    setLocal(value)
  }, [value])

  const commit = useCallback(() => {
    if (local !== value) {
      onEntryChange(index, 'valor', local === '' ? '' : Number(local))
    }
  }, [local, value, index, onEntryChange])

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

export default function DataTable({
  sprints,
  entries,
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
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => {
        const ai = sprintIndexMap.get(a.entry.sprintId) ?? -1
        const bi = sprintIndexMap.get(b.entry.sprintId) ?? -1
        if (ai !== bi) return bi - ai
        return a.entry.tipo === 'Scope' ? -1 : 1
      })
  }, [entries, sprints])

  const cumulatives = useMemo(() => {
    const result = new Map()
    let scopeRun = 0
    let completedRun = 0
    for (const s of sprints) {
      const scopeEntry = entries.find(
        (e) => e.sprintId === s.id && e.tipo === 'Scope'
      )
      if (scopeEntry) {
        scopeRun =
          scopeEntry.mode === 'absolute'
            ? Number(scopeEntry.valor) || 0
            : scopeRun + (Number(scopeEntry.valor) || 0)
      }
      const completedEntry = entries.find(
        (e) => e.sprintId === s.id && e.tipo === 'Completed'
      )
      if (completedEntry) {
        completedRun =
          completedEntry.mode === 'absolute'
            ? Number(completedEntry.valor) || 0
            : completedRun + (Number(completedEntry.valor) || 0)
      }
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i]
        if (e.sprintId === s.id) {
          const acc = e.tipo === 'Scope' ? scopeRun : completedRun
          result.set(i, acc)
        }
      }
    }
    return result
  }, [entries, sprints])

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

  const availableSprintsForTipo = useCallback(
    (tipo) => {
      return sprints.filter((s) => !usedSprints[tipo].has(s.id))
    },
    [sprints, usedSprints]
  )

  useEffect(() => {
    if (sprints.length === 0) {
      setTplSprintId('')
      return
    }
    const available = availableSprintsForTipo(tplTipo)
    if (available.length === 0) {
      setTplSprintId('')
    } else if (!available.some((s) => s.id === tplSprintId)) {
      setTplSprintId(available[0].id)
    }
  }, [sprints, tplTipo, usedSprints, availableSprintsForTipo, tplSprintId])

  const wouldToggleDuplicate = useCallback(
    (entryIndex, entryTipo, entrySprintId) => {
      const switchedTipo = entryTipo === 'Scope' ? 'Completed' : 'Scope'
      return entries.some(
        (e, i) => i !== entryIndex && e.tipo === switchedTipo && e.sprintId === entrySprintId
      )
    },
    [entries]
  )

  const tplScoped = isScope(tplTipo)
  const tplModeClass = tplScoped ? 'tpl-scope' : 'tpl-completed'

  return (
    <div className="data-table-container">

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
                !hasSprints || availableSprintsForTipo(tplTipo).length === 0
              }
              aria-label="New entry sprint"
            >
              {(() => {
                const available = availableSprintsForTipo(tplTipo)
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
                Δ Rel
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 2V12M2 7H12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Add
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="empty-table">
          <svg
            className="empty-table-icon"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="4"
              y="12"
              width="56"
              height="40"
              rx="6"
              stroke="var(--border)"
              strokeWidth="2"
              fill="none"
            />
            <line
              x1="4"
              y1="24"
              x2="60"
              y2="24"
              stroke="var(--border)"
              strokeWidth="1.5"
            />
            <line
              x1="4"
              y1="36"
              x2="60"
              y2="36"
              stroke="var(--border)"
              strokeWidth="1.5"
            />
            <line
              x1="24"
              y1="24"
              x2="24"
              y2="52"
              stroke="var(--border)"
              strokeWidth="1.5"
            />
            <line
              x1="44"
              y1="24"
              x2="44"
              y2="52"
              stroke="var(--border)"
              strokeWidth="1.5"
            />
            <circle cx="50" cy="50" r="12" fill="var(--accent)" opacity="0.9" />
            <line
              x1="46"
              y1="50"
              x2="54"
              y2="50"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="50"
              y1="46"
              x2="50"
              y2="54"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="empty-table-msg">No entries yet</p>
          <p className="empty-table-hint">
            Use the form below to add your first data point
          </p>
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
              {displayEntries.map(({ entry, index }) => {
                const scoped = isScope(entry.tipo)
                const typeClass = scoped ? 'row-scope' : 'row-completed'
                const cumVal = cumulatives.get(index) ?? 0
                const sprintName =
                  sprints.find((s) => s.id === entry.sprintId)?.name ||
                  'Unknown'
                const switchedTipo = scoped ? 'Completed' : 'Scope'
                const isToggleDisabled = wouldToggleDuplicate(
                  index,
                  entry.tipo,
                  entry.sprintId
                )
                const entryMode = entry.mode || 'relative'

                return (
                  <tr key={index} className={typeClass}>
                    <td className="col-sprint">
                      <select
                        className="input-sprint"
                        value={entry.sprintId}
                        onChange={(e) =>
                          onEntryChange(index, 'sprintId', e.target.value)
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
                              index,
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
                              onEntryChange(index, 'mode', 'relative')
                            }
                            title="Relative: value is a delta"
                          >
                            Δ
                          </button>
                          <button
                            type="button"
                            className={`mode-btn ${entryMode === 'absolute' ? 'mode-btn-active' : ''} ${scoped ? 'mode-btn-scope' : 'mode-btn-completed'}`}
                            onClick={() =>
                              onEntryChange(index, 'mode', 'absolute')
                            }
                            title="Absolute: value is the final total"
                          >
                            =
                          </button>
                        </div>
              <EntryValueInput
                value={entry.valor}
                index={index}
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
                        onClick={() => onEntryDelete(index)}
                        title="Delete entry"
                        aria-label="Delete entry"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
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
