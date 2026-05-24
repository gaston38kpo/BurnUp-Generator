/**
 * BurnupChart.jsx — Sprint-based burnup visualization
 *
 * Renders a burnup chart with three lines + area fills:
 *   1. Scope (accumulated per sprint) — solid indigo line + gradient fill
 *   2. Completed (accumulated per sprint) — solid emerald line + gradient fill
 *   3. Ideal (linear reference) — dashed gray line
 *
 * One data point per sprint. Sprint names are X-axis labels.
 */

import { useMemo } from 'react'
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
} from 'recharts'
import { computeChartData } from '../lib/chartData'
import ChartSettings from './ChartSettings'

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
      <p className="chart-tooltip-date">{label}</p>
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

export default function BurnupChart({ sprints, entries, chartConfig, onChartConfigChange }) {
  const { data: chartData } = useMemo(
    () => computeChartData(sprints, entries),
    [sprints, entries]
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
          <p className="chart-empty-text">Add sprints to see the burnup chart</p>
        </div>
        <ChartSettings chartConfig={chartConfig} onChartConfigChange={onChartConfigChange} />
      </div>
    )
  }

  return (
    <div className="burnup-chart-container">
      <ChartSettings chartConfig={chartConfig} onChartConfigChange={onChartConfigChange} />
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
            dataKey="sprint"
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
            type={chartConfig.scopeType}
            dataKey="scope"
            stroke="yellow"
            fill="url(#gradScope)"
            isAnimationActive={false}
          />
          <Area
            type={chartConfig.completedType}
            dataKey="completed"
            stroke="red"
            fill="url(#gradCompleted)"
            isAnimationActive={false}
          />

          {/* Scope line */}
          <Line
            type={chartConfig.scopeType}
            dataKey="scope"
            name="Scope"
            stroke="var(--scope)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, stroke: 'var(--scope)', strokeWidth: 2, fill: 'var(--bg)' }}
          />

          {/* Completed line */}
          <Line
            type={chartConfig.completedType}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
