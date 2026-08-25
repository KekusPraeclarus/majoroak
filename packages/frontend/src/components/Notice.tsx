import type { ReactNode } from "react"

import { Info, OctagonX, TriangleAlert } from "./Icon"

type Kind = "info" | "warn" | "err" | "ok"

const ICON: Record<Kind, typeof Info> = {
  info: Info,
  warn: TriangleAlert,
  err: OctagonX,
  ok: Info,
}

/** A leading icon, a bold first line, one body sentence. Read docs/brand/components.md. */
export function Notice({
  kind = "info",
  title,
  children,
}: {
  kind?: Kind
  title?: string
  children: ReactNode
}) {
  const Glyph = ICON[kind]
  return (
    <div className={`notice ${kind}`} role={kind === "err" ? "alert" : "status"}>
      <Glyph size={16} />
      <span>
        {title && <strong>{title}</strong>}
        {children}
      </span>
    </div>
  )
}
