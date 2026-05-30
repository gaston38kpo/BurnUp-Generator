import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataTable from './DataTable'
import { computeCumulatives } from '../domain/chartData'

describe('DataTable', () => {
  const sprints = [
    { id: 's0', name: 'Sprint 0' },
    { id: 's1', name: 'Sprint 1' },
  ]

  const baseProps = {
    sprints,
    entries: [],
    sprintMap: new Map(),
    onEntryChange: vi.fn(),
    onEntryDelete: vi.fn(),
    onEntryAdd: vi.fn(),
  }

  it('renders the entry template form', () => {
    render(<DataTable {...baseProps} />)
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Scope').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByLabelText('New entry value')).toBeInTheDocument()
    expect(screen.getByLabelText('Add entry')).toBeInTheDocument()
  })

  it('shows empty state when no entries', () => {
    render(<DataTable {...baseProps} />)
    expect(screen.getByText('No entries yet')).toBeInTheDocument()
  })

  it('adds an entry via the template form', () => {
    render(<DataTable {...baseProps} />)
    const addBtn = screen.getByLabelText('Add entry')
    fireEvent.click(addBtn)
    expect(baseProps.onEntryAdd).toHaveBeenCalledWith(
      's0',
      'Completed',
      0,
      'relative',
    )
  })

  it('toggles entry type between Completed and Scope', () => {
    render(<DataTable {...baseProps} />)
    // Pick the first Scope button (template tab, before filter bar)
    const scopeTab = screen.getAllByText('Scope')[0]
    fireEvent.click(scopeTab)
    // The form mode should switch — Scope label should be active
    expect(scopeTab.closest('.tpl-type-tab')).toHaveClass('tpl-type-tab-active')
  })

  it('toggles mode between relative and absolute', () => {
    render(<DataTable {...baseProps} />)
    const absBtn = screen.getByText('= Abs')
    fireEvent.click(absBtn)
    expect(absBtn.closest('.mode-btn')).toHaveClass('mode-btn-active')
  })

  it('disables type pill with locked label when sprint already has that tipo entry', () => {
    const entries = [
      { id: 'e1', sprintId: 's0', tipo: 'Scope', valor: 10, mode: 'relative' },
      { id: 'e2', sprintId: 's0', tipo: 'Completed', valor: 5, mode: 'relative' },
    ]
    const { sprintMap } = computeCumulatives(sprints, entries)
    const props = { ...baseProps, entries, sprintMap }
    render(<DataTable {...props} />)

    // Both type pills should be disabled since switching would create a duplicate
    const scopePill = screen.getByLabelText(/^Entry type: Scope/)
    const completedPill = screen.getByLabelText(/^Entry type: Completed/)

    expect(scopePill).toBeDisabled()
    expect(completedPill).toBeDisabled()

    // The aria-label should contain "(locked)" when disabled
    expect(scopePill).toHaveAttribute('aria-label', expect.stringContaining('(locked)'))
    expect(completedPill).toHaveAttribute('aria-label', expect.stringContaining('(locked)'))
  })

  it('deletes an entry', () => {
    const entries = [
      {
        id: 'e1',
        sprintId: 's0',
        tipo: 'Scope',
        valor: 10,
        mode: 'relative',
      },
    ]
    const { sprintMap } = computeCumulatives(sprints, entries)
    const props = { ...baseProps, entries, sprintMap }
    render(<DataTable {...props} />)
    const deleteBtn = screen.getByLabelText('Delete entry')
    fireEvent.click(deleteBtn)
    expect(props.onEntryDelete).toHaveBeenCalledWith('e1')
  })

  describe('pagination', () => {
    function makeEntries(count) {
      return Array.from({ length: count }, (_, i) => ({
        id: `e${i}`,
        sprintId: 's0',
        tipo: i < Math.ceil(count / 2) ? 'Scope' : 'Completed',
        valor: 10 + i,
        mode: 'relative',
      }))
    }

    function renderWithEntryCount(count) {
      const entries = makeEntries(count)
      const { sprintMap } = computeCumulatives(sprints, entries)
      return {
        entries,
        ...render(
          <DataTable
            sprints={sprints}
            entries={entries}
            sprintMap={sprintMap}
            onEntryChange={vi.fn()}
            onEntryDelete={vi.fn()}
            onEntryAdd={vi.fn()}
          />
        ),
      }
    }

    it('shows first 10 of 25 entries with correct info text', () => {
      renderWithEntryCount(25)
      expect(screen.getByText('Showing 1–10 of 25 entries')).toBeInTheDocument()
    })

    it('navigates between pages with Next and Previous buttons', () => {
      renderWithEntryCount(25)
      expect(screen.getByText('Showing 1–10 of 25 entries')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      expect(screen.getByText('Showing 11–20 of 25 entries')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
      expect(screen.getByText('Showing 1–10 of 25 entries')).toBeInTheDocument()
    })

    it('disables Previous on first page and Next on last page', () => {
      renderWithEntryCount(25)
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Next page' })).not.toBeDisabled()

      // Navigate to page 3 (last page)
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      expect(screen.getByText('Showing 21–25 of 25 entries')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    })

    it('resets to page 1 when filter type changes', () => {
      renderWithEntryCount(25)

      // Navigate to page 2
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      expect(screen.getByText('Showing 11–20 of 25 entries')).toBeInTheDocument()

      // Click Scope filter — filters to 13 entries (still > 10, so pagination visible)
      fireEvent.click(screen.getByRole('button', { name: 'Show only Scope entries' }))
      expect(screen.getByText('Showing 1–10 of 13 entries')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    })

    it('clamps to page 1 when entries shrink below current offset', () => {
      const { rerender } = renderWithEntryCount(12)

      // Go to page 2
      fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
      expect(screen.getByText('Showing 11–12 of 12 entries')).toBeInTheDocument()

      // Rerender with only 8 entries (simulating deletion)
      const fewerEntries = makeEntries(8)
      const { sprintMap } = computeCumulatives(sprints, fewerEntries)
      rerender(
        <DataTable
          sprints={sprints}
          entries={fewerEntries}
          sprintMap={sprintMap}
          onEntryChange={vi.fn()}
          onEntryDelete={vi.fn()}
          onEntryAdd={vi.fn()}
        />
      )

      // Pagination should not render (8 < 10), proving page was clamped to 1
      expect(screen.queryByRole('button', { name: 'Previous page' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument()
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument()

      // All 8 entries should be visible (empty if page stayed at 2)
      const rows = document.querySelector('.data-table').querySelectorAll('tbody tr')
      expect(rows).toHaveLength(8)
    })
  })
})
