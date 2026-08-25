import type { ReactNode } from "react"

const ICONS: Record<string, ReactNode> = {
  created: (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 1.4" />
    </svg>
  ),
  open: (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="1.4" fill="currentColor" />
    </svg>
  ),
  settled: (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 6.2 L5 8.6 L9.5 3.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  cancelled: (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.2 3.2 L8.8 8.8 M8.8 3.2 L3.2 8.8" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  expired: (
    <svg viewBox="0 0 12 12" aria-hidden="true">
      <circle cx="6" cy="6" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 3.8 V6.2 L8 7.4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
}

export function StatusChip({ label }: { label: string }) {
  const key = label.toLowerCase()
  return (
    <span className={`status-chip ${key}`}>
      {ICONS[key]}
      {label.toUpperCase()}
    </span>
  )
}
