import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChartCopyButton from './ChartCopyButton'

describe('ChartCopyButton', () => {
  const makeRef = (overrides) => ({
    current: {
      querySelector: vi.fn(() => null),
      ...overrides,
    },
  })

  it('renders the copy button', () => {
    render(<ChartCopyButton chartRef={{ current: null }} />)
    expect(screen.getByLabelText('Copy chart as image')).toBeInTheDocument()
  })

  it('shows toast when chartRef is null', async () => {
    render(<ChartCopyButton chartRef={{ current: null }} />)
    fireEvent.click(screen.getByLabelText('Copy chart as image'))
    await waitFor(() => {
      expect(screen.getByText('No chart to export')).toBeInTheDocument()
    })
  })

  it('shows success toast on successful export', async () => {
    render(<ChartCopyButton chartRef={makeRef()} />)
    fireEvent.click(screen.getByLabelText('Copy chart as image'))
    await waitFor(() => {
      expect(screen.getByText('Chart copied!')).toBeInTheDocument()
    })
  })
})
