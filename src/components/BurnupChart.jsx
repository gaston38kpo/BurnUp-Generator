/**
 * BurnupChart.jsx — Sprint-based burnup visualization
 *
 * Exports: BurnupChart (default), renderSprintTick (pure function for testing)
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
import { formatDate } from "../domain/formatDate.js";
import { ACTION_TYPES } from "../application/useUndoRedo";
import ChartSettings from "./ChartSettings";
import ChartCopyButton from "./ChartCopyButton";

/**
 * Pure tick renderer for the XAxis sprint labels.
 * Returns null to hide the first label when showFirstSprintLabel is false.
 * Exported for testing — pure function.
 */
export function renderSprintTick(chartConfig) {
  return ({ x, y, payload, index }) => {
    if (index === 0 && chartConfig.showFirstSprintLabel === false) return null
    return (
      <text x={x} y={y} dy={8} fill="var(--text-dim)" fontSize={11} textAnchor="middle">
        {payload.value}
      </text>
    )
  }
}

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

/**
 * DateControls — Click-to-edit date range picker
 *
 * Same pattern as the old Header dates: displays formatted date as a button,
 * clicking opens a native date input.
 */
function DateControls({ dateFrom, dateTo, dateFromEdit, dateToEdit, dispatch }) {
  return (
    <>
      {dateFromEdit.editing ? (
        <input
          ref={dateFromEdit.ref}
          type='date'
          className='date-input-inline'
          value={dateFrom}
          onChange={(e) =>
            dispatch({ type: ACTION_TYPES.SET_DATE_FROM, payload: e.target.value })
          }
          onBlur={dateFromEdit.close}
          onKeyDown={dateFromEdit.handleKeyDown}
          aria-label='Start date'
          max='2200-12-31'
        />
      ) : (
        <button
          className='date-display'
          onClick={dateFromEdit.open}
          title='Click to edit start date'
        >
          {formatDate(dateFrom) || "No start date"}
        </button>
      )}
      <span className='date-arrow'>→</span>
      {dateToEdit.editing ? (
        <input
          ref={dateToEdit.ref}
          type='date'
          className='date-input-inline'
          value={dateTo}
          onChange={(e) =>
            dispatch({ type: ACTION_TYPES.SET_DATE_TO, payload: e.target.value })
          }
          onBlur={dateToEdit.close}
          onKeyDown={dateToEdit.handleKeyDown}
          aria-label='End date'
          max='2200-12-31'
        />
      ) : (
        <button
          className='date-display'
          onClick={dateToEdit.open}
          title='Click to edit end date'
        >
          {formatDate(dateTo) || "No end date"}
        </button>
      )}
    </>
  );
}

const BurnupChart = memo(function BurnupChart({
  chartData,
  chartConfig,
  onChartConfigChange,
  chartRef,
  dateFrom,
  dateTo,
  dateFromEdit,
  dateToEdit,
  dispatch,
}) {
    const idealColor = chartConfig.idealColor || "var(--ideal)";

  const hasData = chartData.length > 0;

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
        {chartConfig.showDates !== false && (
          <div className='chart-date-edit-group'>
            <DateControls
              dateFrom={dateFrom}
              dateTo={dateTo}
              dateFromEdit={dateFromEdit}
              dateToEdit={dateToEdit}
              dispatch={dispatch}
            />
          </div>
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
        {chartConfig.showDates !== false && (
          <div className='chart-date-edit-group'>
            <DateControls
              dateFrom={dateFrom}
              dateTo={dateTo}
              dateFromEdit={dateFromEdit}
              dateToEdit={dateToEdit}
              dispatch={dispatch}
            />
          </div>
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
                        tick={renderSprintTick(chartConfig)}
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
