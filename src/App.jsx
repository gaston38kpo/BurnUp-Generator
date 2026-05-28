/* eslint-disable react-hooks/refs -- false positives from useInlineEdit hook */
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

import { useState, useRef, useCallback, useMemo } from "react";
import BurnupChart from "./components/BurnupChart";
import StatsBar from "./components/StatsBar";
import DataTable from "./components/DataTable";
import ShareFooter from "./components/ShareFooter";
import Accordion from "./components/Accordion";
import { BurnupLogo, PencilIcon } from "./assets/icons";
import {
    decodeState,
    readUrlToken,
} from "./lib/urlState";
import useUndoRedo, { ACTION_TYPES, DEFAULT_STATE } from "./lib/useUndoRedo";
import useInlineEdit from "./lib/useInlineEdit";
import useUrlSync from "./lib/useUrlSync";
import useKeyboardShortcuts from "./lib/useKeyboardShortcuts";
import { cssVarOverrides } from "./lib/colors";
import { formatDate } from "./lib/formatDate.js";
import { computeChartData } from "./lib/chartData";
import "./App.css";

/** Normalize legacy idealColor "#FFFFFF" to "" (now theme-aware) */
function normalizeIdealColor(cfg) {
  if (cfg && cfg.idealColor === "#FFFFFF") {
    return { ...cfg, idealColor: "" };
  }
  return cfg;
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

    useUrlSync(state.present);
    useKeyboardShortcuts(undo, redo, canUndo, canRedo);

  // ─── Sprint badge inline-edit ──────────────────────────────────────────
  const sprintEdit = useInlineEdit(state.present.sprintCount, 1, (v) =>
    dispatch({ type: ACTION_TYPES.SET_SPRINT_COUNT, payload: v }),
  );

  // ─── Offset badge inline-edit ──────────────────────────────────────────
  const offsetEdit = useInlineEdit(state.present.sprintOffset, 0, (v) =>
    dispatch({ type: ACTION_TYPES.SET_SPRINT_OFFSET, payload: v }),
  );

    // ─── Date inline-edit ──────────────────────────────────────────────────
    const dateFromEdit = useInlineEdit();
    const dateToEdit = useInlineEdit();

    // ─── Entry mutation handlers ────────────────────────────────────────────
    const handleEntryAdd = useCallback((sprintId, tipo, valor, mode) => {
        if (!sprintId) return;
        dispatch({
            type: ACTION_TYPES.ADD_ENTRY,
            payload: { sprintId, tipo, valor, mode },
        });
    }, [dispatch]);

    const handleEntryChange = useCallback((id, field, value) => {
        dispatch({
            type: ACTION_TYPES.UPDATE_ENTRY,
            payload: { id, field, value },
        });
    }, [dispatch]);

    const handleEntryDelete = useCallback((id) => {
        dispatch({
            type: ACTION_TYPES.DELETE_ENTRY,
            payload: id,
        });
    }, [dispatch]);

    const handleClear = useCallback(() => {
        dispatch({ type: ACTION_TYPES.RESET });
        setV1Error(false);
    }, [dispatch]);

    const handleChartConfigChange = useCallback((fullConfig) => {
        dispatch({ type: ACTION_TYPES.SET_CHART_CONFIG, payload: fullConfig });
    }, [dispatch]);

    // ─── Computed data (memoized) ─────────────────────────────────────────┬─
  const { data: chartData, maxScope, sprintMap } = useMemo(
    () => computeChartData(state.present.sprints, state.present.entries),
    [state.present.sprints, state.present.entries],
  )

  const cssVars = useMemo(
    () => cssVarOverrides(
      state.present.chartConfig.scopeColor,
      state.present.chartConfig.completedColor,
      state.present.chartConfig.idealColor,
    ),
    [state.present.chartConfig],
  )
    // ─── Render ──────────────────────────────────────────────────────────┴─

    return (
        <div className='app-layout'>
            <style dangerouslySetInnerHTML={{ __html: cssVars }} />
            {/* ── Header ─────────────────────────────────────────────────────── */}
<header className='app-header'>
      <div className='header-row-primary'>
        <div className='header-identity'>
          <BurnupLogo className='header-icon' />
          <input
            type='text'
            className='title-input'
            value={state.present.title}
            onChange={(e) => dispatch({ type: ACTION_TYPES.SET_TITLE, payload: e.target.value })}
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
          {dateFromEdit.editing ? (
            <input
              ref={dateFromEdit.ref}
              type='date'
              className='date-input-inline'
              value={state.present.dateFrom}
              onChange={(e) =>
                dispatch({ type: ACTION_TYPES.SET_DATE_FROM, payload: e.target.value })
              }
              onBlur={dateFromEdit.close}
              onKeyDown={dateFromEdit.handleKeyDown}
              aria-label='Start date'
            />
          ) : (
            <button
              className='date-display'
              onClick={dateFromEdit.open}
              title='Click to edit start date'
            >
              {formatDate(state.present.dateFrom) || "No start date"}
            </button>
          )}
          <span className='date-arrow'>→</span>
          {dateToEdit.editing ? (
            <input
              ref={dateToEdit.ref}
              type='date'
              className='date-input-inline'
              value={state.present.dateTo}
              onChange={(e) =>
                dispatch({ type: ACTION_TYPES.SET_DATE_TO, payload: e.target.value })
              }
              onBlur={dateToEdit.close}
              onKeyDown={dateToEdit.handleKeyDown}
              aria-label='End date'
            />
          ) : (
            <button
              className='date-display'
              onClick={dateToEdit.open}
              title='Click to edit end date'
            >
              {formatDate(state.present.dateTo) || "No end date"}
            </button>
          )}
        </div>
      <div className='meta-badges-group'>
        {sprintEdit.editing ? (
          <input
            ref={sprintEdit.ref}
            type='number'
            className='sprint-badge-input'
            value={sprintEdit.draft}
            min={1}
            step={1}
            onChange={(e) =>
              sprintEdit.setDraft(e.target.value)
            }
            onBlur={sprintEdit.commit}
            onKeyDown={sprintEdit.handleKeyDown}
            aria-label='Number of additional sprints'
          />
        ) : (
          <button
            className='sprint-badge'
            onClick={sprintEdit.open}
            title='Click to edit sprint count'
            aria-label={`${state.present.sprintCount} sprint${state.present.sprintCount !== 1 ? "s" : ""} — click to edit`}
          >
            {state.present.sprintCount} sprint
            {state.present.sprintCount !== 1 ? "s" : ""}
            <PencilIcon className='sprint-badge-icon' />
          </button>
        )}
        {offsetEdit.editing ? (
          <input
            ref={offsetEdit.ref}
            type='number'
            className='offset-badge-input'
            value={offsetEdit.draft}
            min={0}
            step={1}
            onChange={(e) =>
              offsetEdit.setDraft(e.target.value)
            }
            onBlur={offsetEdit.commit}
            onKeyDown={offsetEdit.handleKeyDown}
            aria-label='Sprint offset'
          />
        ) : (
          <button
            className='offset-badge'
            onClick={offsetEdit.open}
            title='Click to edit sprint offset'
            aria-label={`Offset ${state.present.sprintOffset} — click to edit`}
          >
            +{state.present.sprintOffset}
            <PencilIcon className='sprint-badge-icon' />
          </button>
          )}
        </div>
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
            <StatsBar sprintMap={sprintMap} maxScope={maxScope} />

            {/* ── Chart Zone ────────────────────────────────────────────────── */}
            <section className='card chart-card' ref={chartRef}>
      <BurnupChart
        chartData={chartData}
        chartConfig={state.present.chartConfig}
        onChartConfigChange={handleChartConfigChange}
        chartRef={chartRef}
        dateFrom={state.present.dateFrom}
        dateTo={state.present.dateTo}
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
                    sprintMap={sprintMap}
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
