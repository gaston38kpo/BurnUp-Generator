import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BurnupChart from './BurnupChart'

describe('BurnupChart', () => {
  const baseProps = {
    sprints: [],
    entries: [],
    chartConfig: {},
    onChartConfigChange: () => {},
    chartRef: { current: null },
    dateFrom: '',
    dateTo: '',
    title: '',
  }

  it('shows empty state when no data', () => {
    render(<BurnupChart {...baseProps} />)
    expect(
      screen.getByText('Add sprints to see the burnup chart'),
    ).toBeInTheDocument()
  })

  it('renders chart controls when data exists', () => {
    const props = {
      ...baseProps,
      sprints: [
        { id: 's0', name: 'Sprint 1' },
        { id: 's1', name: 'Sprint 2' },
      ],
      entries: [
        { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 10, mode: 'relative' },
        { id: 'e2', sprintId: 's0', tipo: 'Completed', valor: 5, mode: 'relative' },
      ],
    }
    render(<BurnupChart {...props} />)
    expect(
      document.querySelector('.burnup-chart-container'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Chart settings')).toBeInTheDocument()
    expect(screen.getByLabelText('Copy chart as image')).toBeInTheDocument()
  })

  it('displays date range when provided', () => {
    const props = {
      ...baseProps,
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
    }
    render(<BurnupChart {...props} />)
    // Empty state also shows the date range
    expect(screen.getByText(/2026/)).toBeInTheDocument()
  })

  it('shows control buttons in empty state', () => {
    render(<BurnupChart {...baseProps} />)
    expect(screen.getByLabelText('Chart settings')).toBeInTheDocument()
    expect(screen.getByLabelText('Copy chart as image')).toBeInTheDocument()
  })
})
