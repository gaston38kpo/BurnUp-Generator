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

import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { memo } from "react";
import { formatDate } from "../lib/formatDate.js";
import ChartSettings from "./ChartSettings";
import ChartCopyButton from "./ChartCopyButton";

/**
 * Custom legend with colored dots matching line colors.
 */
function CustomLegend({ payload }) {
    return (
        <div className='chart-legend'>
            {payload.map((entry, index) => (
                <span key={index} className='chart-legend-item'>
                    <span
                        className='chart-legend-dot'
                        style={{
                            backgroundColor: entry.color,
                            opacity: entry.lineType === "dash" ? 0.5 : 1,
                        }}
                    />
                    <span className='chart-legend-label'>{entry.value}</span>
                </span>
            ))}
        </div>
    );
}

/**
 * Custom tooltip styled with design tokens.
 */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className='chart-tooltip'>
            <p className='chart-tooltip-date'>{label}</p>
            {payload.map((item, i) => (
                <div key={i} className='chart-tooltip-row'>
                    <span
                        className='chart-tooltip-dot'
                        style={{ backgroundColor: item.color }}
                    />
                    <span className='chart-tooltip-name'>{item.name}</span>
                    <span className='chart-tooltip-value'>{item.value}</span>
                </div>
            ))}
        </div>
    );
}

const BurnupChart = memo(function BurnupChart({
  chartData,
  chartConfig,
  onChartConfigChange,
  chartRef,
  dateFrom,
  dateTo,
}) {
    const idealColor = chartConfig.idealColor || "var(--ideal)";

  const hasData = chartData.length > 0;

  const fromDate = formatDate(dateFrom);
  const toDate = formatDate(dateTo);
  const hasDateRange = fromDate || toDate;

  if (!hasData) {
        return (
            <div className='burnup-chart-container'>
                <div className='chart-empty'>
                    <svg
                        className='chart-empty-icon'
                        viewBox='0 0 120 80'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                    >
                        <rect
                            x='8'
                            y='8'
                            width='104'
                            height='64'
                            rx='8'
                            stroke='var(--border)'
                            strokeWidth='2'
                            fill='none'
                        />
                        <path
                            d='M8 60L30 40L50 50L70 25L90 35L112 20'
                            stroke='var(--scope)'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            opacity='0.3'
                        />
                        <path
                            d='M8 60L30 50L50 52L70 40L90 45L112 35'
                            stroke='var(--completed)'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            opacity='0.3'
                        />
                        <line
                            x1='60'
                            y1='12'
                            x2='60'
                            y2='68'
                            stroke='var(--border)'
                            strokeWidth='1'
                            strokeDasharray='4 3'
                            opacity='0.5'
                        />
                    </svg>
          <p className='chart-empty-text'>
            Add sprints to see the burnup chart
          </p>
        </div>
      <div className='chart-controls'>
        <ChartSettings
          chartConfig={chartConfig}
          onChartConfigChange={onChartConfigChange}
        />
        <ChartCopyButton chartRef={chartRef} />
      </div>
      {hasDateRange && (
        <p className='chart-date-range'>
          {fromDate}{fromDate && toDate ? ' → ' : ''}{toDate}
        </p>
      )}
        </div>
    );
  }

  return (
    <div className='burnup-chart-container'>
      <div className='chart-controls'>
        <ChartSettings
          chartConfig={chartConfig}
          onChartConfigChange={onChartConfigChange}
        />
        <ChartCopyButton chartRef={chartRef} />
      </div>
      {hasDateRange && (
        <p className='chart-date-range'>
          {fromDate}{fromDate && toDate ? ' → ' : ''}{toDate}
        </p>
      )}
      <ResponsiveContainer width='100%' height={400}>
                <ComposedChart
                    data={chartData}
                    margin={{ top: 16, right: 24, left: 8, bottom: 16 }}
                >
                    <defs>
                        <linearGradient
                            id='gradScope'
                            x1='0'
                            y1='0'
                            x2='0'
                            y2='1'
                        >
                            <stop
                                offset='0%'
                                stopColor={chartConfig.scopeColor || "#75AADB"}
                                stopOpacity={0.15}
                            />
                            <stop
                                offset='100%'
                                stopColor={chartConfig.scopeColor || "#75AADB"}
                                stopOpacity={0}
                            />
                        </linearGradient>
                        <linearGradient
                            id='gradCompleted'
                            x1='0'
                            y1='0'
                            x2='0'
                            y2='1'
                        >
                            <stop
                                offset='0%'
                                stopColor={
                                    chartConfig.completedColor || "#FCBF49"
                                }
                                stopOpacity={0.12}
                            />
                            <stop
                                offset='100%'
                                stopColor={
                                    chartConfig.completedColor || "#FCBF49"
                                }
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray='3 3'
                        stroke='var(--border)'
                        opacity={0.3}
                        vertical={false}
                        horizontal={true}
                    />

                    <XAxis
                        dataKey='sprint'
                        tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                    />

                    <YAxis
                        tick={{ fontSize: 11, fill: "var(--text-dim)" }}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                        tickMargin={4}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{
                            stroke: "var(--text-dim)",
                            strokeWidth: 1,
                            strokeDasharray: "4 4",
                        }}
                    />

                    <Legend content={<CustomLegend />} />

                    {/* Scope area + line */}
                    <Area
                        type={chartConfig.scopeType}
                        dataKey='scope'
                        name='Scope'
                        stroke='var(--scope)'
                        strokeWidth={2.5}
                        fill={
                            chartConfig.scopeFill !== false
                                ? "url(#gradScope)"
                                : "none"
                        }
                        dot={false}
                        activeDot={{
                            r: 4,
                            stroke: "var(--scope)",
                            strokeWidth: 2,
                            fill: "var(--bg)",
                        }}
                        isAnimationActive={false}
                    />

                    {/* Completed area + line */}
                    <Area
                        type={chartConfig.completedType}
                        dataKey='completed'
                        name='Completed'
                        stroke='var(--completed)'
                        strokeWidth={2.5}
                        fill={
                            chartConfig.completedFill !== false
                                ? "url(#gradCompleted)"
                                : "none"
                        }
                        dot={false}
                        activeDot={{
                            r: 4,
                            stroke: "var(--completed)",
                            strokeWidth: 2,
                            fill: "var(--bg)",
                        }}
                        isAnimationActive={false}
                    />

                     {/* Ideal line */}
                     <Line
                         type='linear'
                         dataKey='ideal'
                         name='Ideal'
                         stroke={idealColor}
                         strokeWidth={1}
                         strokeDasharray='8 4'
                         dot={false}
                         activeDot={false}
                     />

                      {/* Trend Line */}
                      {chartConfig.showTrendLine && (
                          <Line
                              type='linear'
                              dataKey='trendValue'
                              name='Trend Line'
                              stroke='var(--completed)'
                              strokeWidth={1}
                              strokeDasharray='4 4'
                              dot={false}
                              activeDot={false}
                          />
                      )}
                 </ComposedChart>
             </ResponsiveContainer>
        </div>
    );
});

export default BurnupChart;
