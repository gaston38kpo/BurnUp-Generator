/**
 * App.jsx — Main orchestrator for the Sprint-Based Burnup Chart Generator
 *
 * Architecture:
 * ┌─────────────────────────────────────────────┐
 * │ App (state owner)                           │
 * │ ├─ sprints[] (ordered sprint definitions)   │
 * │ ├─ entries[] (data table rows)              │
 * │                                             │
 * │ ├─ <Header /> (icon + title + sprint count) │
 * │ ├─ <BurnupChart /> (reads state)            │
 * │ ├─ <StatsBar /> (reads entries)             │
 * │ ├─ <DataTable /> (reads + mutates)          │
 * │ └─ <ShareFooter /> (reads URL + chart)      │
 * │                                             │
 * │ URL Sync: state → encode → replaceState     │
 * └─────────────────────────────────────────────┘
 *
 * Sprint model:
 * - Sprint 0 always exists (cannot be removed)
 * - Additional sprints (1..N) controlled by a numeric input
 * - Sprint count input sets N (minimum 1, meaning Sprint 1 exists)
 * - Badge shows N (additional sprints), not counting Sprint 0
 */

import { useState, useEffect, useRef, useCallback } from "react";
import BurnupChart from "./components/BurnupChart";
import StatsBar from "./components/StatsBar";
import DataTable from "./components/DataTable";
import ShareFooter from "./components/ShareFooter";
import Accordion from "./components/Accordion";
import { BurnupLogo, PencilIcon } from "./assets/icons";
import {
    encodeState,
    decodeState,
    readUrlToken,
    writeUrlToken,
} from "./lib/urlState";
import useUndoRedo, { DEFAULT_STATE } from "./lib/useUndoRedo";
import { cssVarOverrides } from "./lib/colors";
import "./App.css";

/** Normalize legacy idealColor "#FFFFFF" to "" (now theme-aware) */
function normalizeIdealColor(cfg) {
  if (cfg && cfg.idealColor === "#FFFFFF") {
    return { ...cfg, idealColor: "" };
  }
  return cfg;
}

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function loadInitialState() {
  const token = readUrlToken();
  if (!token) return { state: DEFAULT_STATE, v1Error: false };
  const decoded = decodeState(token);
  if (decoded?.error === "v1_unsupported") {
    return { state: DEFAULT_STATE, v1Error: true };
  }
  if (decoded && decoded.sprints && decoded.entries) {
    const sprintCount = Math.max(1, decoded.sprints.length - 1);
    return {
      state: {
        title: decoded.title || "",
        sprintCount,
        sprintOffset: decoded.sprintOffset || 0,
        nextEntryId: decoded.nextEntryId || 1,
        sprints: decoded.sprints,
        entries: decoded.entries,
        dateFrom: decoded.dateFrom || "",
        dateTo: decoded.dateTo || "",
        chartConfig: normalizeIdealColor(decoded.chartConfig || DEFAULT_STATE.chartConfig),
      },
      v1Error: false,
    };
  }
  return { state: DEFAULT_STATE, v1Error: false };
}

export default function App() {
    const initial = loadInitialState();
    const { state, dispatch, undo, redo, canUndo, canRedo } = useUndoRedo(initial.state);
    const [v1Error, setV1Error] = useState(initial.v1Error);

  const chartRef = useRef(null);

    // ─── URL synchronization (debounced) ────────────────────────────────────
    const urlSyncTimer = useRef(null);

    useEffect(() => {
        if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);

        urlSyncTimer.current = setTimeout(() => {
            const token = encodeState(state.present);
            writeUrlToken(token);
        }, 300);

        return () => {
            if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
        };
    }, [state.present]);

    // ─── Keyboard shortcuts ───────────────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
            const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));

            if (isUndo && canUndo) {
                e.preventDefault();
                undo();
            } else if (isRedo && canRedo) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, canUndo, canRedo]);

  // ─── Sprint badge inline-edit ──────────────────────────────────────────
  const [editingSprint, setEditingSprint] = useState(false);
  const [sprintDraft, setSprintDraft] = useState(String(state.present.sprintCount));
  const sprintEditRef = useRef(null);

  useEffect(() => {
    if (editingSprint && sprintEditRef.current) {
      sprintEditRef.current.focus();
      sprintEditRef.current.select();
    }
  }, [editingSprint]);

  const openSprintEdit = useCallback(() => {
    setSprintDraft(String(state.present.sprintCount));
    setEditingSprint(true);
  }, [state.present.sprintCount]);

  const commitSprintEdit = useCallback(() => {
    const val = Math.max(1, parseInt(sprintDraft, 10) || 1);
    setSprintDraft(String(val));
    dispatch({ type: 'SET_SPRINT_COUNT', payload: val });
    setEditingSprint(false);
  }, [sprintDraft, dispatch]);

  const cancelSprintEdit = useCallback(() => {
    setSprintDraft(String(state.present.sprintCount));
    setEditingSprint(false);
  }, [state.present.sprintCount]);

    const handleSprintKeyDown = useCallback(
        (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                commitSprintEdit();
            } else if (e.key === "Escape") {
                e.preventDefault();
                cancelSprintEdit();
            }
        },
        [commitSprintEdit, cancelSprintEdit],
    );

  // ─── Sprint draft sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (!editingSprint) {
      setSprintDraft(String(state.present.sprintCount));
    }
  }, [state.present.sprintCount, editingSprint]);

  // ─── Offset badge inline-edit ──────────────────────────────────────────
  const [editingOffset, setEditingOffset] = useState(false);
  const [offsetDraft, setOffsetDraft] = useState(String(state.present.sprintOffset));
  const offsetEditRef = useRef(null);

  useEffect(() => {
    if (editingOffset && offsetEditRef.current) {
      offsetEditRef.current.focus();
      offsetEditRef.current.select();
    }
  }, [editingOffset]);

  useEffect(() => {
    if (!editingOffset) {
      setOffsetDraft(String(state.present.sprintOffset));
    }
  }, [state.present.sprintOffset, editingOffset]);

  const openOffsetEdit = useCallback(() => {
    setOffsetDraft(String(state.present.sprintOffset));
    setEditingOffset(true);
  }, [state.present.sprintOffset]);

  const commitOffsetEdit = useCallback(() => {
    const val = Math.max(0, parseInt(offsetDraft, 10) || 0);
    setOffsetDraft(String(val));
    dispatch({ type: 'SET_SPRINT_OFFSET', payload: val });
    setEditingOffset(false);
  }, [offsetDraft, dispatch]);

  const cancelOffsetEdit = useCallback(() => {
    setOffsetDraft(String(state.present.sprintOffset));
    setEditingOffset(false);
  }, [state.present.sprintOffset]);

  const handleOffsetKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commitOffsetEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelOffsetEdit();
      }
    },
    [commitOffsetEdit, cancelOffsetEdit],
  );

    // ─── Date inline-edit ──────────────────────────────────────────────────
    const [editingDateFrom, setEditingDateFrom] = useState(false);
    const [editingDateTo, setEditingDateTo] = useState(false);
    const dateFromEditRef = useRef(null);
    const dateToEditRef = useRef(null);

    useEffect(() => {
        if (editingDateFrom && dateFromEditRef.current) {
            dateFromEditRef.current.focus();
        }
    }, [editingDateFrom]);

    useEffect(() => {
        if (editingDateTo && dateToEditRef.current) {
            dateToEditRef.current.focus();
        }
    }, [editingDateTo]);

    // ─── Entry mutation handlers ────────────────────────────────────────────
    const handleEntryAdd = useCallback((sprintId, tipo, valor, mode) => {
        if (!sprintId) return;
        dispatch({
            type: 'ADD_ENTRY',
            payload: { sprintId, tipo, valor, mode },
        });
    }, [dispatch]);

    const handleEntryChange = useCallback((id, field, value) => {
        dispatch({
            type: 'UPDATE_ENTRY',
            payload: { id, field, value },
        });
    }, [dispatch]);

    const handleEntryDelete = useCallback((id) => {
        dispatch({
            type: 'DELETE_ENTRY',
            payload: id,
        });
    }, [dispatch]);

    const handleClear = useCallback(() => {
        dispatch({ type: 'RESET' });
        setV1Error(false);
    }, [dispatch]);

    const handleChartConfigChange = useCallback((fullConfig) => {
        dispatch({ type: 'SET_CHART_CONFIG', payload: fullConfig });
    }, [dispatch]);

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className='app-layout'>
            <style dangerouslySetInnerHTML={{ __html: cssVarOverrides(state.present.chartConfig.scopeColor, state.present.chartConfig.completedColor, state.present.chartConfig.idealColor) }} />
            {/* ── Header ─────────────────────────────────────────────────────── */}
<header className='app-header'>
      <div className='header-row-primary'>
        <div className='header-identity'>
          <BurnupLogo className='header-icon' />
          <input
            type='text'
            className='title-input'
            value={state.present.title}
            onChange={(e) => dispatch({ type: 'SET_TITLE', payload: e.target.value })}
            placeholder='Burnup'
            aria-label='Chart title'
          />
        </div>
        <div className='undo-redo-group'>
          <button
            className='undo-redo-btn'
            onClick={undo}
            disabled={!canUndo}
            aria-label='Undo'
            title='Undo (Ctrl+Z / Cmd+Z)'
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 8L7 5M4 8L7 11M4 8H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className='undo-redo-btn'
            onClick={redo}
            disabled={!canRedo}
            aria-label='Redo'
            title='Redo (Ctrl+Y / Cmd+Shift+Z)'
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8L9 5M12 8L9 11M12 8H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div className='header-row-meta'>
        <div className='meta-dates-group'>
          {editingDateFrom ? (
            <input
              ref={dateFromEditRef}
              type='date'
              className='date-input-inline'
              value={state.present.dateFrom}
              onChange={(e) =>
                dispatch({ type: 'SET_DATE_FROM', payload: e.target.value })
              }
              onBlur={() => setEditingDateFrom(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape")
                  setEditingDateFrom(false);
              }}
              aria-label='Start date'
            />
          ) : (
            <button
              className='date-display'
              onClick={() => setEditingDateFrom(true)}
              title='Click to edit start date'
            >
              {formatDate(state.present.dateFrom) || "sin fecha inicio"}
            </button>
          )}
          <span className='date-arrow'>→</span>
          {editingDateTo ? (
            <input
              ref={dateToEditRef}
              type='date'
              className='date-input-inline'
              value={state.present.dateTo}
              onChange={(e) =>
                dispatch({ type: 'SET_DATE_TO', payload: e.target.value })
              }
              onBlur={() => setEditingDateTo(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape")
                  setEditingDateTo(false);
              }}
              aria-label='End date'
            />
          ) : (
            <button
              className='date-display'
              onClick={() => setEditingDateTo(true)}
              title='Click to edit end date'
            >
              {formatDate(state.present.dateTo) || "sin fecha fin"}
            </button>
          )}
        </div>
        {editingSprint ? (
          <input
            ref={sprintEditRef}
            type='number'
            className='sprint-badge-input'
            value={sprintDraft}
            min={1}
            step={1}
            onChange={(e) =>
              setSprintDraft(e.target.value)
            }
            onBlur={commitSprintEdit}
            onKeyDown={handleSprintKeyDown}
            aria-label='Number of additional sprints'
          />
        ) : (
          <button
            className='sprint-badge'
            onClick={openSprintEdit}
            title='Click to edit sprint count'
            aria-label={`${state.present.sprintCount} sprint${state.present.sprintCount !== 1 ? "s" : ""} — click to edit`}
          >
            {state.present.sprintCount} sprint
            {state.present.sprintCount !== 1 ? "s" : ""}
            <PencilIcon className='sprint-badge-icon' />
          </button>
        )}
        {editingOffset ? (
          <input
            ref={offsetEditRef}
            type='number'
            className='offset-badge-input'
            value={offsetDraft}
            min={0}
            step={1}
            onChange={(e) =>
              setOffsetDraft(e.target.value)
            }
            onBlur={commitOffsetEdit}
            onKeyDown={handleOffsetKeyDown}
            aria-label='Sprint offset'
          />
        ) : (
          <button
            className='offset-badge'
            onClick={openOffsetEdit}
            title='Click to edit sprint offset'
            aria-label={`Offset ${state.present.sprintOffset} — click to edit`}
          >
            +{state.present.sprintOffset}
            <PencilIcon className='sprint-badge-icon' />
          </button>
        )}
      </div>

      {v1Error && (
        <div className='v1-error-banner'>
          <span>
            This link uses an older format. Please start fresh.
          </span>
          <button
            onClick={() => setV1Error(false)}
            aria-label='Dismiss'
          >
            &times;
          </button>
        </div>
      )}
    </header>

            {/* ── Stats Bar ────────────────────────────────────────────────── */}
            <StatsBar entries={state.present.entries} sprints={state.present.sprints} />

            {/* ── Chart Zone ────────────────────────────────────────────────── */}
            <section className='card chart-card' ref={chartRef}>
      <BurnupChart
        sprints={state.present.sprints}
        entries={state.present.entries}
        chartConfig={state.present.chartConfig}
        onChartConfigChange={handleChartConfigChange}
        chartRef={chartRef}
      />
            </section>

            {/* ── Data Table (accordion) ──────────────────────────────────── */}
            <Accordion
                title='Data Entries'
                badge={state.present.entries.length || undefined}
                padded={false}
            >
                <DataTable
                    sprints={state.present.sprints}
                    entries={state.present.entries}
                    onEntryChange={handleEntryChange}
                    onEntryDelete={handleEntryDelete}
                    onEntryAdd={handleEntryAdd}
                />
            </Accordion>

            {/* ── Footer: Share ─────────────────────────────────────────────── */}
            <ShareFooter onClear={handleClear} />
        </div>
    );
}
