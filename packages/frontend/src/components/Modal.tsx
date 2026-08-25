import { useEffect, useId, useRef, type ReactNode } from "react"

import { X } from "./Icon"

/**
 * The one dialog shell. Header with a close control, body, right-aligned actions.
 * Read docs/brand/components.md before you change the frame.
 */
export function Modal({
  open,
  title,
  onClose,
  children,
  actions,
}: {
  open: boolean
  title: string
  onClose: () => void
  children?: ReactNode
  actions?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      returnTo.current?.focus()
    }
  }, [open, onClose])

  return (
    <div className="scrim" data-state={open ? "open" : "closed"} hidden={!open} onClick={onClose}>
      <div
        className="modal"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children && <div className="modal-body">{children}</div>}
        {actions && <div className="modal-foot">{actions}</div>}
      </div>
    </div>
  )
}

/** A confirmation before a row action moves value. */
export function ConfirmModal({
  open,
  title,
  summary,
  consequence,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  summary?: ReactNode
  consequence: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      actions={
        <>
          <button type="button" className="btn ghost" onClick={onClose}>
            Keep the deal
          </button>
          <button type="button" className="btn danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {summary}
      <p>{consequence}</p>
    </Modal>
  )
}
