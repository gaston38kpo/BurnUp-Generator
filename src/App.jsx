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

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import BurnupChart from "./components/BurnupChart";
import StatsBar from "./components/StatsBar";
import DataTable from "./components/DataTable";
import ShareFooter from "./components/ShareFooter";
import Accordion from "./components/Accordion";
import SnapshotHistory from "./components/SnapshotHistory";
import {
    encodeState,
    decodeState,
    readUrlToken,
    writeUrlToken,
} from "./lib/urlState";
import { cssVarOverrides } from "./lib/colors";
import "./App.css";

const SPRINT_0_ID = "s0";
const SPRINT_0_NAME = "Sprint 0";

function buildSprints(count) {
    // count = additional sprints (1..N). Total = count + 1 (including Sprint 0)
    const sprints = [{ id: SPRINT_0_ID, name: SPRINT_0_NAME }];
    for (let i = 1; i <= count; i++) {
        sprints.push({ id: "s" + i, name: "Sprint " + i });
    }
    return sprints;
}

const DEFAULT_SPRINT_COUNT = 1;

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

const DEFAULT_STATE = {
    title: "",
    sprintCount: DEFAULT_SPRINT_COUNT,
    sprints: buildSprints(DEFAULT_SPRINT_COUNT),
    entries: [],
    dateFrom: "",
    dateTo: "",
    chartConfig: { scopeType: "linear", completedType: "linear", scopeFill: true, completedFill: true, scopeColor: "#75AADB", completedColor: "#FCBF49", idealColor: "" },
};

function loadInitialState() {
    const token = readUrlToken();
    if (token) {
        const decoded = decodeState(token);
        if (decoded?.error === "v1_unsupported") {
            return { state: DEFAULT_STATE, v1Error: true };
        }
        if (decoded && decoded.sprints && decoded.entries) {
            // Derive sprintCount from loaded sprints (total - 1 for Sprint 0)
            const sprintCount = Math.max(1, decoded.sprints.length - 1);
            return {
                state: {
                    title: decoded.title || "",
                    sprintCount,
                    sprints: decoded.sprints,
                    entries: decoded.entries,
                    dateFrom: decoded.dateFrom || "",
                    dateTo: decoded.dateTo || "",
                    chartConfig:
                        decoded.chartConfig || DEFAULT_STATE.chartConfig,
                },
                v1Error: false,
            };
        }
    }
    return { state: DEFAULT_STATE, v1Error: false };
}

export default function App() {
    const initial = loadInitialState();
    const [title, setTitle] = useState(initial.state.title);
    const [sprintCount, setSprintCount] = useState(initial.state.sprintCount);
    const [sprints, setSprints] = useState(initial.state.sprints);
    const [entries, setEntries] = useState(initial.state.entries);
    const [dateFrom, setDateFrom] = useState(initial.state.dateFrom);
    const [dateTo, setDateTo] = useState(initial.state.dateTo);
    const [chartConfig, setChartConfig] = useState(initial.state.chartConfig);
    const [v1Error, setV1Error] = useState(initial.v1Error);

    // ─── Session-only snapshot history ────────────────────────────────────
    const [snapshots, setSnapshots] = useState([]);

    const chartRef = useRef(null);

    // ─── URL synchronization (debounced) ────────────────────────────────────
    const urlSyncTimer = useRef(null);
    const lastSnapshotUrl = useRef(null);

    useEffect(() => {
        if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);

        urlSyncTimer.current = setTimeout(() => {
            const state = {
                title,
                sprints,
                entries,
                dateFrom,
                dateTo,
                chartConfig,
            };
            const token = encodeState(state);
            writeUrlToken(token);

            // Track snapshot (session-only, max 10)
            const currentUrl = window.location.href;
            if (currentUrl !== lastSnapshotUrl.current) {
                lastSnapshotUrl.current = currentUrl;
                const now = new Date();
                const time = now.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });
                setSnapshots((prev) => {
                    const next = [
                        { url: currentUrl, time, title: state.title },
                        ...prev,
                    ];
                    return next.slice(0, 10);
                });
            }
        }, 300);

        return () => {
            if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
        };
    }, [title, sprints, entries, dateFrom, dateTo, chartConfig]);

    // ─── Sprint count management ───────────────────────────────────────────
    const handleSprintCountChange = useCallback((newCount) => {
        const count = Math.max(1, Number(newCount) || 1);
        setSprintCount(count);
        setSprints((prev) => {
            const currentCount = prev.length - 1; // subtract Sprint 0
            if (count === currentCount) return prev;

            if (count > currentCount) {
                // Add sprints
                const added = [];
                for (let i = currentCount + 1; i <= count; i++) {
                    added.push({ id: "s" + i, name: "Sprint " + i });
                }
                return [...prev, ...added];
            } else {
                // Remove sprints from the end (but never Sprint 0)
                const kept = prev.slice(0, count + 1); // +1 for Sprint 0
                // Also remove entries belonging to removed sprints
                const keptIds = new Set(kept.map((s) => s.id));
                setEntries((prevEntries) =>
                    prevEntries.filter((e) => keptIds.has(e.sprintId)),
                );
                return kept;
            }
        });
    }, []);

    // ─── Sprint badge inline-edit ──────────────────────────────────────────
    const [editingSprint, setEditingSprint] = useState(false);
    const [sprintDraft, setSprintDraft] = useState(String(sprintCount));
    const sprintEditRef = useRef(null);

    useEffect(() => {
        if (editingSprint && sprintEditRef.current) {
            sprintEditRef.current.focus();
            sprintEditRef.current.select();
        }
    }, [editingSprint]);

    useEffect(() => {
        setSprintDraft(String(sprintCount));
    }, [sprintCount]);

    const commitSprintEdit = useCallback(() => {
        const val = Math.max(1, parseInt(sprintDraft, 10) || 1);
        setSprintDraft(String(val));
        handleSprintCountChange(val);
        setEditingSprint(false);
    }, [sprintDraft, handleSprintCountChange]);

    const cancelSprintEdit = useCallback(() => {
        setSprintDraft(String(sprintCount));
        setEditingSprint(false);
    }, [sprintCount]);

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
        setEntries((prev) => [
            ...prev,
            {
                sprintId,
                tipo,
                valor: Number(valor) || 0,
                mode: mode || "relative",
            },
        ]);
    }, []);

    const handleEntryChange = useCallback((originalIndex, field, value) => {
        setEntries((prev) => {
            const updated = [...prev];
            updated[originalIndex] = {
                ...updated[originalIndex],
                [field]: value,
            };
            return updated;
        });
    }, []);

    const handleEntryDelete = useCallback((originalIndex) => {
        setEntries((prev) => prev.filter((_, i) => i !== originalIndex));
    }, []);

    const handleClear = useCallback(() => {
        setTitle("");
        setSprintCount(DEFAULT_SPRINT_COUNT);
        setSprints(buildSprints(DEFAULT_SPRINT_COUNT));
        setEntries([]);
        setDateFrom("");
        setDateTo("");
        setChartConfig({ scopeType: "linear", completedType: "linear", scopeFill: true, completedFill: true, scopeColor: "#75AADB", completedColor: "#FCBF49", idealColor: "#FFFFFF" });
        setV1Error(false);
    }, []);

    // ─── Restore snapshot ─────────────────────────────────────────────────
    const handleRestoreSnapshot = useCallback(
        (index) => {
            const snap = snapshots[index];
            if (!snap) return;
            const params = new URLSearchParams(new URL(snap.url).search);
            const token = params.get("data");
            if (!token) return;
            const decoded = decodeState(token);
            if (!decoded?.sprints) return;
            const sprintCount = Math.max(1, decoded.sprints.length - 1);
            setTitle(decoded.title || "");
            setSprintCount(sprintCount);
            setSprints(decoded.sprints);
            setEntries(decoded.entries);
            setDateFrom(decoded.dateFrom || "");
            setDateTo(decoded.dateTo || "");
    setChartConfig(
      decoded.chartConfig || {
        scopeType: "linear",
        completedType: "linear",
        scopeFill: true,
        completedFill: true,
        scopeColor: "#75AADB",
        completedColor: "#FCBF49",
        idealColor: "",
      },
    );
            setV1Error(false);
        },
        [snapshots],
    );

    const handleChartConfigChange = useCallback((key, value) => {
        setChartConfig((prev) => ({ ...prev, [key]: value }));
    }, []);

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className='app-layout'>
            <style dangerouslySetInnerHTML={{ __html: cssVarOverrides(chartConfig.scopeColor, chartConfig.completedColor, chartConfig.idealColor) }} />
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <header className='app-header'>
                <div className='header-top'>
        <svg
          className='header-icon'
          viewBox='0 0 32 32'
          fill='none'
          xmlns='http://www.w3.org/2000/svg'
        >
          <rect
            width='32'
            height='32'
            rx='8'
            fill='var(--accent)'
          />
          <path
            d='M6 24V6'
            stroke='white'
            strokeWidth='1.5'
            strokeLinecap='round'
            opacity='0.4'
          />
          <path
            d='M6 24H26'
            stroke='white'
            strokeWidth='1.5'
            strokeLinecap='round'
            opacity='0.4'
          />
          <path
            d='M6 8H26'
            stroke='white'
            strokeWidth='1.5'
            strokeLinecap='round'
            opacity='0.4'
            strokeDasharray='3 2'
          />
          <path
            d='M6 22C9 22 11 16 14 14C17 12 19 10 26 8'
            stroke='var(--scope)'
            strokeWidth='2.5'
            strokeLinecap='round'
            fill='none'
          />
          <path
            d='M6 22C9 22 12 18 16 14C20 10 22 10 26 10'
            stroke='var(--completed)'
            strokeWidth='2.5'
            strokeLinecap='round'
            fill='none'
          />
        </svg>

                    <div className='header-text'>
                        <h1 className='app-title'>
                            <input
                                type='text'
                                className='title-input'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder='Burnup'
                                aria-label='Chart title'
                            />
                        </h1>

                        <div className='header-meta'>
                            <p className='app-subtitle'>
                                BurnUp Chart Generator
                            </p>
                            <span className='date-range'>
                                {editingDateFrom ? (
                                    <input
                                        ref={dateFromEditRef}
                                        type='date'
                                        className='date-input-inline'
                                        value={dateFrom}
                                        onChange={(e) =>
                                            setDateFrom(e.target.value)
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
                                        {formatDate(dateFrom) || "sin fecha inicio"}
                                    </button>
                                )}
                                <span className='date-arrow'>→</span>
                                {editingDateTo ? (
                                    <input
                                        ref={dateToEditRef}
                                        type='date'
                                        className='date-input-inline'
                                        value={dateTo}
                                        onChange={(e) =>
                                            setDateTo(e.target.value)
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
                                        {formatDate(dateTo) || "sin fecha fin"}
                                    </button>
                                )}
                            </span>
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
                                    onClick={() => setEditingSprint(true)}
                                    title='Click to edit sprint count'
                                    aria-label={`${sprintCount} sprint${sprintCount !== 1 ? "s" : ""} — click to edit`}
                                >
                                    {sprintCount} sprint
                                    {sprintCount !== 1 ? "s" : ""}
                                    <svg
                                        className='sprint-badge-icon'
                                        width='12'
                                        height='12'
                                        viewBox='0 0 16 16'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                    >
                                        <path
                                            d='M10.5 2.5L13.5 5.5L5 14H2V11L10.5 2.5Z'
                                            stroke='currentColor'
                                            strokeWidth='1.5'
                                            strokeLinejoin='round'
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
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
            <StatsBar entries={entries} sprints={sprints} />

            {/* ── Chart Zone ────────────────────────────────────────────────── */}
            <section className='card chart-card' ref={chartRef}>
                <BurnupChart
                    sprints={sprints}
                    entries={entries}
                    chartConfig={chartConfig}
                    onChartConfigChange={handleChartConfigChange}
                />
            </section>

            {/* ── Data Table (accordion) ──────────────────────────────────── */}
            <Accordion
                title='Data Entries'
                badge={entries.length || undefined}
                padded={false}
            >
                <DataTable
                    sprints={sprints}
                    entries={entries}
                    onEntryChange={handleEntryChange}
                    onEntryDelete={handleEntryDelete}
                    onEntryAdd={handleEntryAdd}
                />
            </Accordion>

            {/* ── Footer: Share ─────────────────────────────────────────────── */}
            <ShareFooter chartRef={chartRef} onClear={handleClear} />

            {/* ── Snapshot History (accordion, session-only) ─────────────────── */}
            <Accordion
                title='Recent Snapshots'
                badge={snapshots.length || undefined}
                defaultOpen={false}
            >
                <SnapshotHistory
                    snapshots={snapshots}
                    onRestore={handleRestoreSnapshot}
                    onClearHistory={() => setSnapshots([])}
                />
            </Accordion>
        </div>
    );
}
