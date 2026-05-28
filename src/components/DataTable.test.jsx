import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataTable from './DataTable'

describe('DataTable', () => {
  const sprints = [
    { id: 's0', name: 'Sprint 0' },
    { id: 's1', name: 'Sprint 1' },
  ]

  const baseProps = {
    sprints,
    entries: [],
    onEntryChange: vi.fn(),
    onEntryDelete: vi.fn(),
    onEntryAdd: vi.fn(),
  }

  it('renders the entry template form', () => {
    render(<DataTable {...baseProps} />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Scope')).toBeInTheDocument()
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
    const scopeTab = screen.getByText('Scope')
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
    const props = { ...baseProps, entries }
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
    const props = {
      ...baseProps,
      entries: [
        {
          id: 'e1',
          sprintId: 's0',
          tipo: 'Scope',
          valor: 10,
          mode: 'relative',
        },
      ],
    }
    render(<DataTable {...props} />)
    const deleteBtn = screen.getByLabelText('Delete entry')
    fireEvent.click(deleteBtn)
    expect(props.onEntryDelete).toHaveBeenCalledWith('e1')
  })
})
