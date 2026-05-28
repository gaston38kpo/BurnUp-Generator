import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import ShareFooter from './ShareFooter'

describe('ShareFooter', () => {
  it('displays the current URL', () => {
    render(<ShareFooter onClear={() => {}} />)
    const urlInput = screen.getByLabelText('Shareable URL')
    expect(urlInput).toBeInTheDocument()
    expect(urlInput).toHaveValue(window.location.href)
  })

  it('copies URL to clipboard', async () => {
    render(<ShareFooter onClear={() => {}} />)
    const footer = screen.getByRole('contentinfo')
    const copyBtn = within(footer).getByRole('button', { name: /copy shareable/i })
    fireEvent.click(copyBtn)
    await waitFor(() => {
      expect(screen.getByText('Link copied!')).toBeInTheDocument()
    })
  })

  it('shows clear confirmation dialog', () => {
    render(<ShareFooter onClear={() => {}} />)
    const footer = screen.getByRole('contentinfo')
    const clearBtn = within(footer).getByRole('button', { name: /clear all data/i })
    fireEvent.click(clearBtn)
    expect(screen.getByText('Clear all data?')).toBeInTheDocument()
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('hides dialog and does not call onClear when No is clicked', () => {
    const onClear = vi.fn()
    render(<ShareFooter onClear={onClear} />)

    const footer = screen.getByRole('contentinfo')
    const clearBtn = within(footer).getByRole('button', { name: /clear all data/i })
    fireEvent.click(clearBtn)

    // Verify dialog is open
    expect(screen.getByText('Clear all data?')).toBeInTheDocument()

    // Click No
    const noBtn = screen.getByText('No')
    fireEvent.click(noBtn)

    // Dialog should be hidden
    expect(screen.queryByText('Clear all data?')).not.toBeInTheDocument()

    // onClear should NOT have been called
    expect(onClear).not.toHaveBeenCalled()
  })

  it('shows toast notification on copy', async () => {
    render(<ShareFooter onClear={() => {}} />)
    const footer = screen.getByRole('contentinfo')
    const copyBtn = within(footer).getByRole('button', { name: /copy shareable/i })
    fireEvent.click(copyBtn)
    await waitFor(() => {
      expect(screen.getByText('Link copied!')).toBeInTheDocument()
    })
  })
})
