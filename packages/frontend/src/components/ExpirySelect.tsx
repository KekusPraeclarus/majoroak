import { useCallback, useRef, useState } from "react"

import { onMenuKeyDown, useDismiss } from "../lib/menu"
import { Check, ChevronDown, Clock } from "./Icon"

export const EXPIRY_CHOICES = [
  { label: "1 hour", secs: 3600 },
  { label: "24 hours", secs: 86400 },
  { label: "3 days", secs: 259200 },
  { label: "7 days", secs: 604800 },
] as const

export function ExpirySelect({
  value,
  onChange,
}: {
  value: number
  onChange: (secs: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const current = EXPIRY_CHOICES.find((c) => c.secs === value) ?? EXPIRY_CHOICES[1]

  return (
    <div className="select" ref={ref}>
      <button
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Clock size={16} className="muted" />
        <span className="select-value">{current.label}</span>
        <ChevronDown size={16} className="caret" />
      </button>

      <div
        className="select-menu right"
        role="listbox"
        data-state={open ? "open" : "closed"}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
      >
        {EXPIRY_CHOICES.map((c) => (
          <button
            type="button"
            key={c.secs}
            data-option
            role="option"
            aria-selected={c.secs === value}
            className="select-option"
            onClick={() => {
              onChange(c.secs)
              close()
            }}
          >
            <span className="select-value">{c.label}</span>
            <Check size={16} className="check" />
          </button>
        ))}
      </div>
    </div>
  )
}
