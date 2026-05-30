import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BurnupChart, { renderSprintTick } from './BurnupChart'
import { computeChartData } from '../lib/chartData'

/**
 * Helper to invoke the tick renderer and return the tick text.
 * Returns null when the tick is hidden, or the text string when visible.
 */
function renderTick(config, { value, index }) {
  const tickFn = renderSprintTick(config)
  const result = tickFn({ x: 0, y: 0, payload: { value }, index })
  if (result === null) return null
  return result.props.children
}

/** Inline-edit mock (closed state) */
const mockEdit = {
  editing: false,
  draft: '',
  setDraft: () => {},
  ref: { current: null },
  open: () => {},
  commit: () => {},
  cancel: () => {},
  close: () => {},
  handleKeyDown: () => {},
}

describe('BurnupChart', () => {
  const baseProps = {
    chartData: [],
    chartConfig: {},
    onChartConfigChange: () => {},
    chartRef: { current: null },
    dateFrom: '',
    dateTo: '',
    dateFromEdit: mockEdit,
    dateToEdit: mockEdit,
    dispatch: () => {},
  }

  it('shows empty state when no data', () => {
    render(<BurnupChart {...baseProps} />)
    expect(
      screen.getByText('Add sprints to see the burnup chart'),
    ).toBeInTheDocument()
  })

  it('renders chart controls when data exists', () => {
    const sprints = [
      { id: 's0', name: 'Sprint 1' },
      { id: 's1', name: 'Sprint 2' },
    ]
    const entries = [
      { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 10, mode: 'relative' },
      { id: 'e2', sprintId: 's0', tipo: 'Completed', valor: 5, mode: 'relative' },
    ]
    const { data: chartData } = computeChartData(sprints, entries)
    const props = { ...baseProps, chartData }
    render(<BurnupChart {...props} />)
    expect(
      document.querySelector('.burnup-chart-container'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Chart settings')).toBeInTheDocument()
    expect(screen.getByLabelText('Copy chart as image')).toBeInTheDocument()
  })

  it('displays editable date controls when dates provided', () => {
    const props = {
      ...baseProps,
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    }
    render(<BurnupChart {...props} />)
    // Two date-display buttons in the date-edit-group
    const group = document.querySelector('.chart-date-edit-group')
    expect(group).toBeInTheDocument()
    expect(group).toHaveTextContent(/1 de ene/)
    expect(group).toHaveTextContent(/31 de dic/)
  })

  it('hides the first sprint label when showFirstSprintLabel is false', () => {
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 1', index: 0 })).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 2', index: 1 })).toBe('Sprint 2')
  })

  it('shows the first sprint label by default (no config)', () => {
    expect(renderTick({}, { value: 'Sprint 1', index: 0 })).toBe('Sprint 1')
    expect(renderTick({}, { value: 'Sprint 2', index: 1 })).toBe('Sprint 2')
  })

  it('shows the first sprint label when showFirstSprintLabel is true', () => {
    expect(renderTick({ showFirstSprintLabel: true }, { value: 'Sprint 1', index: 0 })).toBe('Sprint 1')
    expect(renderTick({ showFirstSprintLabel: true }, { value: 'Sprint 2', index: 1 })).toBe('Sprint 2')
  })

  it('shows control buttons in empty state', () => {
    render(<BurnupChart {...baseProps} />)
    expect(screen.getByLabelText('Chart settings')).toBeInTheDocument()
    expect(screen.getByLabelText('Copy chart as image')).toBeInTheDocument()
  })
})
