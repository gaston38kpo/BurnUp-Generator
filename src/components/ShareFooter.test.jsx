import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import ShareFooter from './ShareFooter'

describe('ShareFooter', () => {
  it('displays the current URL', () => {
    render(<ShareFooter />)
    const urlInput = screen.getByLabelText('Shareable URL')
    expect(urlInput).toBeInTheDocument()
    expect(urlInput).toHaveValue(window.location.href)
  })

  it('copies URL to clipboard', async () => {
    render(<ShareFooter />)
    const footer = screen.getByRole('contentinfo')
    const copyBtn = within(footer).getByRole('button', { name: /copy shareable/i })
    fireEvent.click(copyBtn)
    await waitFor(() => {
      expect(screen.getByText('Link copied!')).toBeInTheDocument()
    })
  })

  it('shows toast notification on copy', async () => {
    render(<ShareFooter />)
    const footer = screen.getByRole('contentinfo')
    const copyBtn = within(footer).getByRole('button', { name: /copy shareable/i })
    fireEvent.click(copyBtn)
    await waitFor(() => {
      expect(screen.getByText('Link copied!')).toBeInTheDocument()
    })
  })
})
