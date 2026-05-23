/**
 * App.jsx — Main orchestrator for the Burnup Chart Generator
 *
 * Architecture:
 *   ┌─────────────────────────────────────────────┐
 *   │  App (state owner)                           │
 *   │  ├─ fechaInicio, fechaFin (date filters)     │
 *   │  ├─ entries[] (data table rows)              │
 *   │  │                                           │
 *   │  ├─ <Header /> (icon + title + date filters) │
 *   │  ├─ <BurnupChart /> (reads state)            │
 *   │  ├─ <StatsBar /> (reads entries)             │
 *   │  ├─ <DataTable /> (reads + mutates)          │
 *   │  └─ <ShareFooter /> (reads URL + chart)      │
 *   │                                              │
 *   │  URL Sync: state → encode → replaceState     │
 *   └─────────────────────────────────────────────┘
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import BurnupChart from './components/BurnupChart'
import StatsBar from './components/StatsBar'
import DataTable from './components/DataTable'
import ShareFooter from './components/ShareFooter'
import { encodeState, decodeState, readUrlToken, writeUrlToken } from './lib/urlState'
import './App.css'

const DEFAULT_STATE = {
  fechaInicio: '',
  fechaFin: '',
  entries: [],
}

function loadInitialState() {
  const token = readUrlToken()
  if (token) {
    const decoded = decodeState(token)
    if (decoded) return decoded
  }
  return DEFAULT_STATE
}

export default function App() {
  const [fechaInicio, setFechaInicio] = useState(() => loadInitialState().fechaInicio)
  const [fechaFin, setFechaFin] = useState(() => loadInitialState().fechaFin)
  const [entries, setEntries] = useState(() => loadInitialState().entries)

  const chartRef = useRef(null)

  // ─── URL synchronization (debounced) ────────────────────────────────────
  const urlSyncTimer = useRef(null)

  useEffect(() => {
    if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current)

    urlSyncTimer.current = setTimeout(() => {
      const state = { fechaInicio, fechaFin, entries }
      const token = encodeState(state)
      writeUrlToken(token)
    }, 300)

    return () => {
      if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current)
    }
  }, [fechaInicio, fechaFin, entries])

  // ─── Sorted entries for display (newest date first) ────────────────────
  const sortedEntries = useMemo(() => {
    return entries
      .map((entry, originalIndex) => ({ ...entry, originalIndex }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [entries])

  // ─── Entry mutation handlers ────────────────────────────────────────────
  const handleEntryAdd = useCallback((fecha, tipo, valor) => {
    setEntries((prev) => [
      ...prev,
      { fecha, tipo, valor },
    ])
  }, [])

  const handleEntryChange = useCallback((originalIndex, field, value) => {
    setEntries((prev) => {
      const updated = [...prev]
      updated[originalIndex] = { ...updated[originalIndex], [field]: value }
      return updated
    })
  }, [])

  const handleEntryDelete = useCallback((originalIndex) => {
    setEntries((prev) => prev.filter((_, i) => i !== originalIndex))
  }, [])

  const handleClear = useCallback(() => {
    setEntries([])
  }, [])

  // ─── Compute sprint duration ───────────────────────────────────────────
  const sprintDays = useMemo(() => {
    if (!fechaInicio || !fechaFin) return null
    const start = new Date(fechaInicio)
    const end = new Date(fechaFin)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    return days > 0 ? days : null
  }, [fechaInicio, fechaFin])

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="app-layout">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-top">
          <div className="header-brand">
            <svg className="header-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="var(--accent)"/>
              <path d="M6 24V8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M6 24H26" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M6 18C10 18 12 10 16 10C20 10 22 16 26 16" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <path d="M6 24C10 24 12 18 16 18C20 18 22 22 26 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5"/>
            </svg>
            <div>
              <h1 className="app-title">Burnup</h1>
              <p className="app-subtitle">Chart Generator</p>
            </div>
          </div>
          {sprintDays && (
            <span className="sprint-badge">
              {sprintDays} day{sprintDays !== 1 ? 's' : ''}
            </span>
          )}
        </div>

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
          <div className="filter-arrow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8H13M10 5L13 8L10 11" stroke="var(--text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
      <section className="card chart-card" ref={chartRef}>
        <BurnupChart
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          entries={entries}
        />
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────── */}
      <StatsBar entries={entries} />

      {/* ── Data Table ────────────────────────────────────────────────── */}
      <section className="card table-card">
        <DataTable
          entries={sortedEntries}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onEntryChange={handleEntryChange}
          onEntryDelete={handleEntryDelete}
          onEntryAdd={handleEntryAdd}
        />
      </section>

      {/* ── Footer: Share ─────────────────────────────────────────────── */}
      <ShareFooter chartRef={chartRef} onClear={handleClear} />
    </div>
  )
}
