/**
 * BurnupChart.jsx — The core visualization component
 *
 * Renders a burnup chart with three lines + area fills:
 *   1. Scope (accumulated) — solid indigo line + gradient fill
 *   2. Completed (accumulated) — solid emerald line + gradient fill
 *   3. Ideal (linear reference) — dashed gray line
 *
 * Plus a vertical "Today" reference line when today falls within the range.
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
 */

import { useMemo } from 'react'
import dayjs from 'dayjs'
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

/**
 * Compute the chart data points from the app state.
 */
function computeChartData(fechaInicio, fechaFin, entries) {
  if (!fechaInicio || !fechaFin) return { data: [], maxScope: 0, todayInRange: false }

  const start = dayjs(fechaInicio)
  const end = dayjs(fechaFin)

  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return { data: [], maxScope: 0, todayInRange: false }

  const today = dayjs().format('YYYY-MM-DD')
  const todayInRange = today >= fechaInicio && today <= fechaFin

  const sortedScope = entries
    .filter((e) => e.tipo === 'Scope' && e.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const sortedCompleted = entries
    .filter((e) => e.tipo === 'Completed' && e.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

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

    while (scopeIdx < scopeDates.length && scopeDates[scopeIdx] <= currentDay) {
      scopeSoFar = scopeCumulative.get(scopeDates[scopeIdx])
      scopeIdx++
    }

    while (completedIdx < completedDates.length && completedDates[completedIdx] <= currentDay) {
      completedSoFar = completedCumulative.get(completedDates[completedIdx])
      completedIdx++
    }

    const maxScope = scopeRunning
    const ideal = totalDays > 0 ? (maxScope * d) / totalDays : 0

    data.push({
      date: currentDay,
      scope: scopeSoFar,
      completed: completedSoFar,
      ideal: Math.round(ideal * 100) / 100,
    })
  }

  return { data, maxScope: scopeRunning, todayInRange }
}

/**
 * Format X-axis labels: show DD/MM at adaptive intervals.
 */
function formatXAxisLabel(dateStr, index, allData) {
  if (!allData || allData.length === 0) return ''
  if (index === 0 || index === allData.length - 1) {
    return dayjs(dateStr).format('DD/MM')
  }
  const interval = Math.max(1, Math.floor(allData.length / 8))
  if (index % interval === 0) {
    return dayjs(dateStr).format('DD/MM')
  }
  return ''
}

/**
 * Custom legend with colored dots matching line colors.
 */
function CustomLegend({ payload }) {
  return (
    <div className="chart-legend">
      {payload.map((entry, index) => (
        <span key={index} className="chart-legend-item">
          <span
            className="chart-legend-dot"
            style={{
              backgroundColor: entry.color,
              opacity: entry.lineType === 'dash' ? 0.5 : 1,
            }}
          />
          <span className="chart-legend-label">{entry.value}</span>
        </span>
      ))}
    </div>
  )
}

/**
 * Custom tooltip styled with design tokens.
 */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-date">{dayjs(label).format('dddd, DD MMM YYYY')}</p>
      {payload.map((item, i) => (
        <div key={i} className="chart-tooltip-row">
          <span
            className="chart-tooltip-dot"
            style={{ backgroundColor: item.color }}
          />
          <span className="chart-tooltip-name">{item.name}</span>
          <span className="chart-tooltip-value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function BurnupChart({ fechaInicio, fechaFin, entries }) {
  const { data: chartData, todayInRange } = useMemo(
    () => computeChartData(fechaInicio, fechaFin, entries),
    [fechaInicio, fechaFin, entries]
  )

  const hasData = chartData.length > 0

  if (!hasData) {
    return (
      <div className="burnup-chart-container">
        <div className="chart-empty">
          <svg className="chart-empty-icon" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="104" height="64" rx="8" stroke="var(--border)" strokeWidth="2" fill="none"/>
            <path d="M8 60L30 40L50 50L70 25L90 35L112 20" stroke="var(--scope)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
            <path d="M8 60L30 50L50 52L70 40L90 45L112 35" stroke="var(--completed)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
            <line x1="60" y1="12" x2="60" y2="68" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 3" opacity="0.5"/>
          </svg>
          <p className="chart-empty-text">Set start and end dates to see the burnup chart</p>
        </div>
      </div>
    )
  }

  return (
    <div className="burnup-chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 16, right: 24, left: 8, bottom: 16 }}
        >
          <defs>
            <linearGradient id="gradScope" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--scope)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--scope)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--completed)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="var(--completed)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            opacity={0.5}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={(val, idx) => formatXAxisLabel(val, idx, chartData)}
            tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tickMargin={8}
          />

          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-dim)' }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickMargin={4}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--text-dim)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />

          <Legend content={<CustomLegend />} />

          {/* Area fills for visual weight */}
          <Area
            type="stepAfter"
            dataKey="scope"
            stroke="none"
            fill="url(#gradScope)"
            isAnimationActive={false}
          />
          <Area
            type="stepAfter"
            dataKey="completed"
            stroke="none"
            fill="url(#gradCompleted)"
            isAnimationActive={false}
          />

          {/* Scope line */}
          <Line
            type="stepAfter"
            dataKey="scope"
            name="Scope"
            stroke="var(--scope)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, stroke: 'var(--scope)', strokeWidth: 2, fill: 'var(--bg)' }}
          />

          {/* Completed line */}
          <Line
            type="stepAfter"
            dataKey="completed"
            name="Completed"
            stroke="var(--completed)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, stroke: 'var(--completed)', strokeWidth: 2, fill: 'var(--bg)' }}
          />

          {/* Ideal line */}
          <Line
            type="linear"
            dataKey="ideal"
            name="Ideal"
            stroke="var(--ideal)"
            strokeWidth={1.5}
            strokeDasharray="8 4"
            dot={false}
            activeDot={false}
          />

          {/* Today marker */}
          {todayInRange && (
            <ReferenceLine
              x={dayjs().format('YYYY-MM-DD')}
              stroke="var(--warning)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              label={{
                value: 'Today',
                position: 'top',
                fill: 'var(--warning)',
                fontSize: 11,
                fontWeight: 600,
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
