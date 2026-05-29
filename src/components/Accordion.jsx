/**
 * Accordion.jsx — Reusable collapsible section
 *
 * Props:
 * - title: string (header label)
 * - badge?: string | number (optional counter badge)
 * - defaultOpen?: boolean
 * - children: ReactNode
 */
import { useState } from 'react'
import { ChevronDown } from '../assets/icons'

export default function Accordion({ title, badge, defaultOpen = true, padded = true, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`accordion ${open ? 'accordion-open' : ''}`}>
      <button
        className="accordion-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <ChevronDown className="accordion-chevron" />
        <span className="accordion-title">{title}</span>
        {badge !== undefined && (
          <span className="accordion-badge">{badge}</span>
        )}
      </button>
      <div className={`accordion-body ${padded ? 'accordion-body-padded' : ''}`}>
        {children}
      </div>
    </div>
  )
}
