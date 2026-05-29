/**
 * ports.js — Domain Model Typedefs & Port Interfaces
 *
 * Domain entities and port contracts for the Burnup Generator.
 * This file is the single source of truth for domain types.
 * ZERO external dependencies — pure JSDoc + constants.
 *
 * Dependency direction: domain/ imports NOTHING from outside domain/.
 */

/**
 * @typedef {Object} Sprint
 * @property {string} id   - Unique sprint identifier (e.g. "s0", "s1")
 * @property {string} name - Human-readable sprint name (e.g. "Sprint 0")
 */

/**
 * @typedef {Object} Entry
 * @property {string} id       - Auto-incremented entry identifier
 * @property {string} sprintId - References Sprint.id
 * @property {string} tipo     - "Scope" | "Completed"
 * @property {number} valor    - Numeric value
 * @property {string} mode     - "relative" | "absolute"
 */

/**
 * @typedef {Object} ChartConfig
 * @property {string}  scopeType      - "linear" | "stepAfter"
 * @property {string}  completedType  - "linear" | "stepAfter"
 * @property {boolean} scopeFill      - Fill area under scope line
 * @property {boolean} completedFill  - Fill area under completed line
 * @property {string}  scopeColor     - CSS color for scope line
 * @property {string}  completedColor - CSS color for completed line
 * @property {string}  idealColor     - CSS color for ideal line (empty = theme default)
 * @property {boolean} [showTrendLine] - Show regression trend line
 */

/**
 * @typedef {Object} BurnupState
 * @property {string}      title        - Chart title
 * @property {number}      sprintCount  - Number of additional sprints (beyond Sprint 0)
 * @property {number}      sprintOffset - Sprint numbering offset
 * @property {number}      nextEntryId  - Auto-increment counter for entries
 * @property {Sprint[]}    sprints      - Ordered sprint definitions (Sprint 0 + 1..N)
 * @property {Entry[]}     entries      - Data table rows
 * @property {string}      dateFrom     - Start date (ISO string)
 * @property {string}      dateTo       - End date (ISO string)
 * @property {ChartConfig} chartConfig  - Chart appearance configuration
 */

/**
 * @typedef {Object} UndoRedoState
 * @property {BurnupState[]} past    - Previous states (undo stack)
 * @property {BurnupState}   present - Current state
 * @property {BurnupState[]} future  - Future states (redo stack)
 */

/**
 * @typedef {Object} VelocityInfo
 * @property {number}  velocity         - Average completed points per sprint (0 if no data)
 * @property {number|null} forecast     - Estimated remaining sprints (null if velocity is 0)
 * @property {number}  remaining        - Points remaining to complete
 * @property {number}  completedSprints - Number of sprints with Completed entries
 * @property {number}  totalDelta       - Sum of all completed deltas
 */

// ─── Port interfaces (contracts) ──────────────────────────────────────────────

/**
 * BurnupState port — shape expected by all consumers.
 * @param {BurnupState} state
 * @returns {boolean}
 */
export function isValidBurnupState(state) {
  return (
    state &&
    typeof state.sprintCount === 'number' &&
    typeof state.nextEntryId === 'number' &&
    Array.isArray(state.sprints) &&
    Array.isArray(state.entries)
  )
}

/**
 * ChartData port — contract for chart data computation.
 * @typedef {Object} ChartDataPort
 * @property {(sprints: Sprint[], entries: Entry[]) => {data: Array, maxScope: number, sprintMap: Map}} computeChartData
 */

/**
 * Colors port — contract for color/CSS variable generation.
 * @typedef {Object} ColorsPort
 * @property {(hex: string) => {r: number, g: number, b: number}} hexToRgb
 * @property {(scopeColor: string, completedColor: string, idealColor: string) => string} cssVarOverrides
 */

/**
 * FormatDate port — contract for date formatting.
 * @typedef {Object} FormatDatePort
 * @property {(iso: string) => string} formatDate
 */

/**
 * Reducer port — contract for state management (undo/redo-aware).
 * @typedef {Object} ReducerPort
 * @property {Object}  ACTION_TYPES   - Action type constants
 * @property {Function} appReducer    - Pure state reducer (no React deps)
 * @property {Function} buildSprints   - Sprint factory
 * @property {BurnupState} DEFAULT_STATE - Default app state
 * @property {Function} withUndo      - Higher-order reducer wrapper
 * @property {Function} undoRedoReducer - Composed reducer (undo + app)
 */
