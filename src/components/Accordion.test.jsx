import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Accordion from './Accordion'

describe('Accordion', () => {
  it('renders the title', () => {
    render(<Accordion title="My Title">content</Accordion>)
    expect(screen.getByText('My Title')).toBeInTheDocument()
  })

  it('toggles open/closed on click', () => {
    render(<Accordion title="Toggle Me">content</Accordion>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows badge when provided', () => {
    render(<Accordion title="Badge" badge={7}>content</Accordion>)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('starts open when defaultOpen is true', () => {
    render(<Accordion title="Open" defaultOpen>content</Accordion>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })

  it('updates aria-expanded on toggle', () => {
    render(<Accordion title="Aria">content</Accordion>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })

  it('renders children', () => {
    render(
      <Accordion title="Children">
        <span data-testid="child">child content</span>
      </Accordion>,
    )
    expect(screen.getByTestId('child')).toHaveTextContent('child content')
  })
})
