import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BurnupChart, { renderSprintTick } from './BurnupChart'
import { computeChartData } from '../domain/chartData'

/**
 * Helper to invoke the tick renderer and return the tick text.
 * Returns null when the tick is hidden, or the text string when visible.
 */
function renderTick(config, { value, index }, totalCount = 0) {
  const tickFn = renderSprintTick(config, totalCount)
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

  // ── Label format ranges ──

  it('uses full sprint names when there are 15 or fewer sprints', () => {
    expect(renderTick({}, { value: 'Sprint Alpha', index: 0 }, 15)).toBe('Sprint Alpha')
    expect(renderTick({}, { value: 'Sprint Beta', index: 5 }, 15)).toBe('Sprint Beta')
    expect(renderTick({}, { value: 'Sprint 0', index: 0 }, 1)).toBe('Sprint 0')
  })

  it('uses S labels with the actual sprint number (respects offset)', () => {
    // Offset 10 → sprint names start at "Sprint 10"
    expect(renderTick({}, { value: 'Sprint 10', index: 0 }, 16)).toBe('S10')
    expect(renderTick({}, { value: 'Sprint 15', index: 5 }, 16)).toBe('S15')
    expect(renderTick({}, { value: 'Sprint 25', index: 15 }, 16)).toBe('S25')
  })

  it('uses S0, S1, ... labels for 16 to 30 sprints', () => {
    expect(renderTick({}, { value: 'Sprint 0', index: 0 }, 16)).toBe('S0')
    expect(renderTick({}, { value: 'Sprint 5', index: 5 }, 16)).toBe('S5')
    expect(renderTick({}, { value: 'Sprint 15', index: 15 }, 16)).toBe('S15')
    expect(renderTick({}, { value: 'Sprint 10', index: 10 }, 30)).toBe('S10')
  })

  // ── Progressive skip past 30 ──

  it('uses bare numbers from the sprint name (respects offset)', () => {
    // Offset 50 → sprint names start at "Sprint 50"
    expect(renderTick({}, { value: 'Sprint 50', index: 0 }, 31)).toBe('50')
    expect(renderTick({}, { value: 'Sprint 55', index: 5 }, 31)).toBe('55')
    expect(renderTick({}, { value: 'Sprint 80', index: 30 }, 31)).toBe('80')
  })

  it('31-50 (step=1): shows all bare numbers', () => {
    expect(renderTick({}, { value: 'Sprint 0', index: 0 }, 31)).toBe('0')
    expect(renderTick({}, { value: 'Sprint 5', index: 5 }, 31)).toBe('5')
    expect(renderTick({}, { value: 'Sprint 30', index: 30 }, 31)).toBe('30')
    expect(renderTick({}, { value: 'Sprint 19', index: 19 }, 50)).toBe('19')
  })

  it('51-70 (step=2): shows even indices only', () => {
    expect(renderTick({}, { value: 'Sprint 0', index: 0 }, 51)).toBe('0')
    expect(renderTick({}, { value: 'Sprint 1', index: 1 }, 51)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 2', index: 2 }, 51)).toBe('2')
    expect(renderTick({}, { value: 'Sprint 3', index: 3 }, 51)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 50', index: 50 }, 70)).toBe('50')
    expect(renderTick({}, { value: 'Sprint 51', index: 51 }, 70)).toBeNull()
  })

  it('71-90 (step=3): shows multiples of 3', () => {
    expect(renderTick({}, { value: 'Sprint 0', index: 0 }, 71)).toBe('0')
    expect(renderTick({}, { value: 'Sprint 1', index: 1 }, 71)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 2', index: 2 }, 71)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 3', index: 3 }, 71)).toBe('3')
    expect(renderTick({}, { value: 'Sprint 6', index: 6 }, 71)).toBe('6')
    expect(renderTick({}, { value: 'Sprint 69', index: 69 }, 90)).toBe('69')
    expect(renderTick({}, { value: 'Sprint 70', index: 70 }, 90)).toBeNull()
  })

  it('91-110 (step=4): shows multiples of 4', () => {
    expect(renderTick({}, { value: 'Sprint 0', index: 0 }, 91)).toBe('0')
    expect(renderTick({}, { value: 'Sprint 1', index: 1 }, 91)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 3', index: 3 }, 91)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 4', index: 4 }, 91)).toBe('4')
    expect(renderTick({}, { value: 'Sprint 8', index: 8 }, 91)).toBe('8')
    expect(renderTick({}, { value: 'Sprint 9', index: 9 }, 91)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 88', index: 88 }, 110)).toBe('88')
  })

  it('111-130 (step=5): shows multiples of 5', () => {
    expect(renderTick({}, { value: 'Sprint 0', index: 0 }, 111)).toBe('0')
    expect(renderTick({}, { value: 'Sprint 4', index: 4 }, 111)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 5', index: 5 }, 111)).toBe('5')
    expect(renderTick({}, { value: 'Sprint 10', index: 10 }, 111)).toBe('10')
    expect(renderTick({}, { value: 'Sprint 11', index: 11 }, 111)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 14', index: 14 }, 130)).toBeNull()
    expect(renderTick({}, { value: 'Sprint 15', index: 15 }, 130)).toBe('15')
  })

  // ── showFirstSprintLabel across ranges ──

  it('hides the first sprint label when showFirstSprintLabel is false (≤15)', () => {
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 1', index: 0 })).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 2', index: 1 })).toBe('Sprint 2')
  })

  it('shows the first sprint label by default', () => {
    expect(renderTick({}, { value: 'Sprint 1', index: 0 })).toBe('Sprint 1')
    expect(renderTick({}, { value: 'Sprint 2', index: 1 })).toBe('Sprint 2')
  })

  it('shows the first sprint label when showFirstSprintLabel is true', () => {
    expect(renderTick({ showFirstSprintLabel: true }, { value: 'Sprint 1', index: 0 })).toBe('Sprint 1')
    expect(renderTick({ showFirstSprintLabel: true }, { value: 'Sprint 2', index: 1 })).toBe('Sprint 2')
  })

  it('respects showFirstSprintLabel with 16-30 range (S labels)', () => {
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 0', index: 0 }, 16)).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 1', index: 1 }, 16)).toBe('S1')
  })

  it('respects showFirstSprintLabel with 31-50 range (step=1)', () => {
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 0', index: 0 }, 40)).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 1', index: 1 }, 40)).toBe('1')
  })

  it('respects showFirstSprintLabel with 51-70 range (step=2)', () => {
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 0', index: 0 }, 60)).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 1', index: 1 }, 60)).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 2', index: 2 }, 60)).toBe('2')
  })

  it('respects showFirstSprintLabel with 71-90 range (step=3)', () => {
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 0', index: 0 }, 80)).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 1', index: 1 }, 80)).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 2', index: 2 }, 80)).toBeNull()
    expect(renderTick({ showFirstSprintLabel: false }, { value: 'Sprint 3', index: 3 }, 80)).toBe('3')
  })

  it('shows control buttons in empty state', () => {
    render(<BurnupChart {...baseProps} />)
    expect(screen.getByLabelText('Chart settings')).toBeInTheDocument()
    expect(screen.getByLabelText('Copy chart as image')).toBeInTheDocument()
  })
})
