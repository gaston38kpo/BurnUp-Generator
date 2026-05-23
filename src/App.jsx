/**
 * App.jsx — Main orchestrator for the Burnup Chart Generator
 *
 * Architecture:
 *   ┌─────────────────────────────────────────┐
 *   │  App (state owner)                       │
 *   │  ├─ fechaInicio, fechaFin (date filters) │
 *   │  ├─ entries[] (data table rows)          │
 *   │  │                                       │
 *   │  ├─ <DateFilters />                      │
 *   │  ├─ <BurnupChart /> (reads state)        │
 *   │  ├─ <DataTable /> (reads + mutates)      │
 *   │  └─ <ShareFooter /> (reads URL + chart)  │
 *   │                                          │
 *   │  URL Sync: state → encode → replaceState │
 *   └─────────────────────────────────────────┘
 *
 * State flow:
 *   1. On mount: read ?data= token → decode → initialize state
 *   2. On every state change: re-render chart + encode state → update URL
 *   3. Debounced URL writes to avoid thrashing during rapid edits
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import dayjs from 'dayjs'
import BurnupChart from './components/BurnupChart'
import DataTable from './components/DataTable'
import ShareFooter from './components/ShareFooter'
import { encodeState, decodeState, readUrlToken, writeUrlToken } from './lib/urlState'
import './App.css'

// ─── Default empty state ──────────────────────────────────────────────────────

const DEFAULT_STATE = {
  fechaInicio: '',
  fechaFin: '',
  entries: [],
}

/**
 * Initialize app state from the URL token, or return defaults.
 */
function loadInitialState() {
  const token = readUrlToken()
  if (token) {
    const decoded = decodeState(token)
    if (decoded) return decoded
  }
  return DEFAULT_STATE
}

export default function App() {
  // ─── Core state ─────────────────────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState(() => loadInitialState().fechaInicio)
  const [fechaFin, setFechaFin] = useState(() => loadInitialState().fechaFin)
  const [entries, setEntries] = useState(() => loadInitialState().entries)

  // Ref to the chart container for image export
  const chartRef = useRef(null)

  // ─── URL synchronization (debounced) ────────────────────────────────────
  // We debounce URL writes because during rapid edits (e.g. typing a value)
  // we don't want to compress + replaceState on every keystroke.
  const urlSyncTimer = useRef(null)

  useEffect(() => {
    if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current)

    urlSyncTimer.current = setTimeout(() => {
      const state = { fechaInicio, fechaFin, entries }
      const token = encodeState(state)
      writeUrlToken(token)
    }, 300) // 300ms debounce

    return () => {
      if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current)
    }
  }, [fechaInicio, fechaFin, entries])

  // ─── Entry mutation handlers ────────────────────────────────────────────

  const handleEntryAdd = useCallback(() => {
    // Default new entry: first day of the range, Scope type, value 0
    const defaultDate = fechaInicio || dayjs().format('YYYY-MM-DD')
    setEntries((prev) => [
      ...prev,
      { fecha: defaultDate, tipo: 'Scope', valor: '' },
    ])
  }, [fechaInicio])

  const handleEntryChange = useCallback((index, field, value) => {
    setEntries((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  const handleEntryDelete = useCallback((index) => {
    setEntries((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="app-layout">
      {/* ── Header: Date Filters ──────────────────────────────────────── */}
      <header className="date-filters">
        <h1 className="app-title">Burnup Chart Generator</h1>
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="fecha-inicio" className="filter-label">
              Start Date
            </label>
            <input
              id="fecha-inicio"
              type="date"
              className="input-date filter-input"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              aria-label="Project start date"
            />
          </div>
          <div className="filter-group">
            <label htmlFor="fecha-fin" className="filter-label">
              End Date
            </label>
            <input
              id="fecha-fin"
              type="date"
              className="input-date filter-input"
              value={fechaFin}
              min={fechaInicio || undefined}
              onChange={(e) => setFechaFin(e.target.value)}
              aria-label="Project end date"
            />
          </div>
        </div>
      </header>

      {/* ── Chart Zone ────────────────────────────────────────────────── */}
      <section className="chart-section" ref={chartRef}>
        <BurnupChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          entries={entries}
        />
      </section>

      {/* ── Data Table ────────────────────────────────────────────────── */}
      <section className="table-section">
        <DataTable
          entries={entries}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onEntryChange={handleEntryChange}
          onEntryDelete={handleEntryDelete}
          onEntryAdd={handleEntryAdd}
        />
      </section>

      {/* ── Footer: Share ─────────────────────────────────────────────── */}
      <ShareFooter chartRef={chartRef} />
    </div>
  )
}
