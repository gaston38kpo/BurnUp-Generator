/* eslint-disable react-hooks/refs -- false positives from useInlineEdit hook */
/**
 * App.jsx — Thin orchestrator for the Burnup Chart Generator
 *
 * Wires domain state (burnupReducer) to UI components through React hooks.
 * Header extracted to components/Header.jsx.
 * Hooks from src/application/, pure logic from src/domain/.
 */

import { useState, useRef, useCallback, useMemo } from "react";
import BurnupChart from "./components/BurnupChart";
import StatsBar from "./components/StatsBar";
import VelocityEstimate from "./components/VelocityEstimate";
import DataTable from "./components/DataTable";
import ShareFooter from "./components/ShareFooter";
import Accordion from "./components/Accordion";
import Header from "./components/Header";
import { cssVarOverrides } from "./domain/colors";
import { computeChartData, computeCumulatives } from "./domain/chartData";
import { computeVelocity } from "./domain/velocity";
import { decodeState, readUrlToken } from "./adapters/UrlStateAdapter";
import useUndoRedo, { ACTION_TYPES, DEFAULT_STATE } from "./application/useUndoRedo";
import useInlineEdit from "./application/useInlineEdit";
import useUrlSync from "./application/useUrlSync";
import useKeyboardShortcuts from "./application/useKeyboardShortcuts";
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

    // ─── Default-state detection ─────────────────────────────────────────────
    const isDefault =
      state.present.entries.length === 0 &&
      state.present.title === '' &&
      state.present.dateFrom === '' &&
      state.present.dateTo === '' &&
      state.present.sprintCount === DEFAULT_STATE.sprintCount &&
      state.present.sprintOffset === DEFAULT_STATE.sprintOffset;

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

  const velocityInfo = useMemo(
    () => {
      const { sprintMap: velSprintMap, entryBySprintTipo, maxScope: velMaxScope } =
        computeCumulatives(state.present.sprints, state.present.entries)
      return computeVelocity(velSprintMap, entryBySprintTipo, velMaxScope)
    },
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
            <Header
              state={state.present}
              dispatch={dispatch}
              undo={undo}
              redo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              sprintEdit={sprintEdit}
              offsetEdit={offsetEdit}
              v1Error={v1Error}
              onDismissV1Error={() => setV1Error(false)}
              onClear={handleClear}
              disabled={isDefault}
            />

            {/* ── Stats Bar ────────────────────────────────────────────────── */}
            <StatsBar sprintMap={sprintMap} maxScope={maxScope} />

            {/* ── Velocity Forecast ──────────────────────────────────────────── */}
            <VelocityEstimate velocityInfo={velocityInfo} />

            {/* ── Chart Zone ────────────────────────────────────────────────── */}
            <section className='card chart-card' ref={chartRef}>
              <BurnupChart
                chartData={chartData}
                chartConfig={state.present.chartConfig}
                onChartConfigChange={handleChartConfigChange}
                chartRef={chartRef}
                dateFrom={state.present.dateFrom}
                dateTo={state.present.dateTo}
                dateFromEdit={dateFromEdit}
                dateToEdit={dateToEdit}
                dispatch={dispatch}
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
            <ShareFooter />
        </div>
    );
}
