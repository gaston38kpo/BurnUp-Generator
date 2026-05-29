import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VelocityForecast from './VelocityForecast'

describe('VelocityForecast', () => {
  it('renders velocity and forecast values when data exists', () => {
    const velocityInfo = {
      velocity: 6,
      forecast: 2,
      remaining: 8,
      completedSprints: 2,
      totalDelta: 12,
    }
    render(<VelocityForecast velocityInfo={velocityInfo} />)

    expect(screen.getByText('Velocity')).toBeInTheDocument()
    expect(screen.getByText('Forecast')).toBeInTheDocument()
    expect(screen.getByText('6.0 pts/sprint')).toBeInTheDocument()
    expect(screen.getByText('~2 sprints')).toBeInTheDocument()
  })

  it('shows empty state when no completed data', () => {
    const velocityInfo = {
      velocity: 0,
      forecast: null,
      remaining: 10,
      completedSprints: 0,
      totalDelta: 0,
    }
    render(<VelocityForecast velocityInfo={velocityInfo} />)

    expect(
      screen.getByText('Add completed entries to calculate velocity and forecast'),
    ).toBeInTheDocument()
  })

  it('shows em dash for null forecast', () => {
    const velocityInfo = {
      velocity: 0,
      forecast: null,
      remaining: 10,
      completedSprints: 1,
      totalDelta: 0,
    }
    render(<VelocityForecast velocityInfo={velocityInfo} />)

    expect(screen.getByText('\u2014')).toBeInTheDocument()
  })

  it('rounds velocity to 2 decimal places', () => {
    const velocityInfo = {
      velocity: 7.333,
      forecast: 2,
      remaining: 14,
      completedSprints: 3,
      totalDelta: 22,
    }
    render(<VelocityForecast velocityInfo={velocityInfo} />)

    expect(screen.getByText('7.3 pts/sprint')).toBeInTheDocument()
  })
})
