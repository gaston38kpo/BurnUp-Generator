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

export default function Accordion({ title, badge, defaultOpen = false, padded = true, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`accordion ${open ? 'accordion-open' : ''}`}>
      <button
        className="accordion-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <svg
          className="accordion-chevron"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 5.5L7 8.5L10 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
