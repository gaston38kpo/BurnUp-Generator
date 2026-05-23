/**
 * BurnupChart.jsx — The core visualization component
 *
 * Renders a burnup chart with three lines:
 *   1. Scope (accumulated) — solid blue line
 *   2. Completed (accumulated) — solid green line
 *   3. Ideal (linear reference) — dashed gray line
 *
 * ─── Accumulation Logic ───────────────────────────────────────────────────
 *
 * The burnup model is cumulative and step-based:
 *
 *   For each date D in [fechaInicio, fechaFin]:
 *     scopeAt(D)     = sum of all Scope entries where entry.fecha <= D
 *     completedAt(D) = sum of all Completed entries where entry.fecha <= D
 *
 * The "Ideal" line is a straight line from (fechaInicio, 0) to
 * (fechaFin, maxScope), representing perfect linear progress.
 *
 * If there are no scope entries, the ideal line stays at 0.
 */

import { useMemo } from 'react'
import dayjs from 'dayjs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

/**
 * Compute the chart data points from the app state.
 *
 * Returns an array of { date, scope, completed, ideal } objects,
 * one per day in the [fechaInicio, fechaFin] range.
 */
function computeChartData(fechaInicio, fechaFin, entries) {
  if (!fechaInicio || !fechaFin) return []

  const start = dayjs(fechaInicio)
  const end = dayjs(fechaFin)

  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return []

  // ─── Pre-sort entries by date for efficient cumulative sum ──────────────
  const sortedScope = entries
    .filter((e) => e.tipo === 'Scope' && e.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const sortedCompleted = entries
    .filter((e) => e.tipo === 'Completed' && e.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // ─── Build cumulative sums per entry date ──────────────────────────────
  // Instead of re-summing for every day, we pre-compute the cumulative
  // value at each unique entry date, then for any given day D we just
  // find the latest entry date <= D and use that cumulative value.

  const scopeCumulative = new Map()
  let scopeRunning = 0
  for (const e of sortedScope) {
    scopeRunning += Number(e.valor) || 0
    scopeCumulative.set(e.fecha, scopeRunning)
  }

  const completedCumulative = new Map()
  let completedRunning = 0
  for (const e of sortedCompleted) {
    completedRunning += Number(e.valor) || 0
    completedCumulative.set(e.fecha, completedRunning)
  }

  // ─── Generate one data point per day ───────────────────────────────────
  const totalDays = end.diff(start, 'day')
  const data = []

  let scopeSoFar = 0
  let completedSoFar = 0
  let scopeIdx = 0
  let completedIdx = 0

  const scopeDates = [...scopeCumulative.keys()]
  const completedDates = [...completedCumulative.keys()]

  for (let d = 0; d <= totalDays; d++) {
    const currentDay = start.add(d, 'day').format('YYYY-MM-DD')

    // Advance scope cumulative if we've reached or passed the next scope entry
    while (scopeIdx < scopeDates.length && scopeDates[scopeIdx] <= currentDay) {
      scopeSoFar = scopeCumulative.get(scopeDates[scopeIdx])
      scopeIdx++
    }

    // Advance completed cumulative similarly
    while (completedIdx < completedDates.length && completedDates[completedIdx] <= currentDay) {
      completedSoFar = completedCumulative.get(completedDates[completedIdx])
      completedIdx++
    }

    // Ideal line: linear from 0 on start date to maxScope on end date
    const maxScope = scopeRunning // final cumulative scope value
    const ideal = totalDays > 0 ? (maxScope * d) / totalDays : 0

    data.push({
      date: currentDay,
      scope: scopeSoFar,
      completed: completedSoFar,
      ideal: Math.round(ideal * 100) / 100, // avoid floating point noise
    })
  }

  return data
}

/**
 * Format the date label to show only DD/MM for cleaner axis labels.
 * Shows the full date only for the first, last, and every 7th day.
 */
function formatXAxisLabel(dateStr, index, allData) {
  if (!allData || allData.length === 0) return dateStr

  // Always show first and last
  if (index === 0 || index === allData.length - 1) {
    return dayjs(dateStr).format('DD/MM')
  }

  // Show every ~7 days depending on total range
  const interval = Math.max(1, Math.floor(allData.length / 8))
  if (index % interval === 0) {
    return dayjs(dateStr).format('DD/MM')
  }

  return ''
}

export default function BurnupChart({ fechaInicio, fechaFin, entries }) {
  const chartData = useMemo(
    () => computeChartData(fechaInicio, fechaFin, entries),
    [fechaInicio, fechaFin, entries]
  )

  const hasData = chartData.length > 0

  return (
    <div className="burnup-chart-container">
      {!hasData ? (
        <div className="chart-placeholder">
          <p>Set start and end dates to see the burnup chart</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={420}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={(val, idx) => formatXAxisLabel(val, idx, chartData)}
              tick={{ fontSize: 12, fill: 'var(--text)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--text)' }}
              tickLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              labelFormatter={(label) => dayjs(label).format('DD/MM/YYYY')}
              formatter={(value, name) => [value, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '8px' }}
            />

            {/* Scope line — solid, blue */}
            <Line
              type="stepAfter"
              dataKey="scope"
              name="Scope"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />

            {/* Completed line — solid, emerald */}
            <Line
              type="stepAfter"
              dataKey="completed"
              name="Completed"
              stroke="#10b981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />

            {/* Ideal line — dashed, gray */}
            <Line
              type="linear"
              dataKey="ideal"
              name="Ideal"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="8 4"
              dot={false}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
