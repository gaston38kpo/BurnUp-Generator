import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import ChartSettings from './ChartSettings'

describe('ChartSettings', () => {
  const defaultConfig = {
    scopeType: 'linear',
    completedType: 'stepAfter',
    scopeFill: true,
    completedFill: true,
    showTrendLine: false,
  }

  /** Find a line type button within the section that has the given label */
  const lineTypeInSection = (sectionLabel, typeLabel) => {
    const section = screen.getByText(sectionLabel).closest('.chart-settings-section')
    return within(section).getByText(typeLabel)
  }

  it('toggles popover open and close on gear click', () => {
    render(
      <ChartSettings
        chartConfig={defaultConfig}
        onChartConfigChange={() => {}}
      />,
    )
    const gear = screen.getByLabelText('Chart settings')
    expect(screen.queryByText('Scope')).not.toBeInTheDocument()
    fireEvent.click(gear)
    expect(screen.getByText('Scope')).toBeInTheDocument()
    fireEvent.click(gear)
    expect(screen.queryByText('Scope')).not.toBeInTheDocument()
  })

  it('selects a line type and applies it', () => {
    const onChange = vi.fn()
    render(
      <ChartSettings
        chartConfig={defaultConfig}
        onChartConfigChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText('Chart settings'))
    // Change scope type from linear to step
    fireEvent.click(lineTypeInSection('Scope', 'Step'))
    fireEvent.click(screen.getByText('Apply'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ scopeType: 'stepAfter' }),
    )
  })

  it('discards changes on Cancel', () => {
    const onChange = vi.fn()
    render(
      <ChartSettings
        chartConfig={defaultConfig}
        onChartConfigChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText('Chart settings'))
    // Change a setting in Scope section
    fireEvent.click(lineTypeInSection('Scope', 'Step'))
    // Cancel
    fireEvent.click(screen.getByText('Cancel'))
    expect(onChange).not.toHaveBeenCalled()
    // Re-open to verify draft was discarded
    fireEvent.click(screen.getByLabelText('Chart settings'))
    // Scope type should be back to linear
    const linearBtn = lineTypeInSection('Scope', 'Linear')
    expect(linearBtn.closest('.chart-settings-opt')).toHaveClass(
      'chart-settings-opt-active',
    )
  })

  it('closes popover on click outside', () => {
    render(
      <ChartSettings
        chartConfig={defaultConfig}
        onChartConfigChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByLabelText('Chart settings'))
    expect(screen.getByText('Scope')).toBeInTheDocument()
    // Click outside the popover
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Scope')).not.toBeInTheDocument()
  })

  it('toggles First Sprint off and applies showFirstSprintLabel=false', () => {
    const onChange = vi.fn()
    render(
      <ChartSettings
        chartConfig={defaultConfig}
        onChartConfigChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText('Chart settings'))
    // First Sprint switch exists and is ON by default
    const firstSprintSwitch = screen.getByRole('switch', { name: 'First Sprint' })
    expect(firstSprintSwitch).toHaveAttribute('aria-checked', 'true')
    // Toggle it
    fireEvent.click(firstSprintSwitch)
    fireEvent.click(screen.getByText('Apply'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ showFirstSprintLabel: false }),
    )
  })

  it('toggles Dates off and applies showDates=false', () => {
    const onChange = vi.fn()
    render(
      <ChartSettings
        chartConfig={defaultConfig}
        onChartConfigChange={onChange}
      />,
    )
    fireEvent.click(screen.getByLabelText('Chart settings'))
    // Dates switch exists and is ON by default
    const datesSwitch = screen.getByRole('switch', { name: 'Dates' })
    expect(datesSwitch).toHaveAttribute('aria-checked', 'true')
    // Toggle it
    fireEvent.click(datesSwitch)
    fireEvent.click(screen.getByText('Apply'))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ showDates: false }),
    )
  })

  it('renders section groups titles', () => {
    render(
      <ChartSettings
        chartConfig={defaultConfig}
        onChartConfigChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByLabelText('Chart settings'))
    expect(screen.getByText('Line Styles')).toBeInTheDocument()
    expect(screen.getByText('Display')).toBeInTheDocument()
  })

  it('renders popover title', () => {
    render(
      <ChartSettings
        chartConfig={defaultConfig}
        onChartConfigChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByLabelText('Chart settings'))
    expect(screen.getByText('Chart Settings')).toBeInTheDocument()
  })
})
