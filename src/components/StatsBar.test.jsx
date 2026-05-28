import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsBar from './StatsBar'
import { computeCumulatives } from '../lib/chartData'

function buildProps(sprints, entries) {
  const { sprintMap, maxScope } = computeCumulatives(sprints, entries)
  return { sprintMap, maxScope }
}

describe('StatsBar', () => {
  const sprints = [
    { id: 's0', name: 'Sprint 0' },
    { id: 's1', name: 'Sprint 1' },
  ]

  it('computes stats from entries', () => {
    const entries = [
      { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 10, mode: 'relative' },
      { id: 'e2', sprintId: 's0', tipo: 'Completed', valor: 5, mode: 'relative' },
    ]
    render(<StatsBar {...buildProps(sprints, entries)} />)
    expect(screen.getByText('Scope')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Remaining')).toBeInTheDocument()
    const values = screen.getAllByText('5')
    expect(values).toHaveLength(2) // completed + remaining
  })

  it('renders progress bar when scope > 0', () => {
    const entries = [
      { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 100, mode: 'relative' },
      { id: 'e2', sprintId: 's1', tipo: 'Completed', valor: 50, mode: 'relative' },
    ]
    render(<StatsBar {...buildProps(sprints, entries)} />)
    expect(document.querySelector('.progress-track')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<StatsBar {...buildProps(sprints, [])} />)
    expect(
      screen.getByText(
        'Add scope and completed entries to see progress',
      ),
    ).toBeInTheDocument()
    expect(document.querySelector('.progress-track')).not.toBeInTheDocument()
  })

  it('handles edge case: zero scope', () => {
    const entries = [
      { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 0, mode: 'relative' },
    ]
    render(<StatsBar {...buildProps(sprints, entries)} />)
    // With zero scope, hasScope is false, and scope=0 so stats compute but don't show progress
    expect(screen.getByText('Add scope and completed entries to see progress')).toBeInTheDocument()
  })
})
