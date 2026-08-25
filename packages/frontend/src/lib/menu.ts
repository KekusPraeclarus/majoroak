import { useEffect, type KeyboardEvent, type RefObject } from "react"

/** Close a menu on an outside pointer press or on Escape. */
export function useDismiss(
  ref: RefObject<HTMLElement>,
  open: boolean,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [ref, open, close])
}

/** Move focus between the options of an open menu with the arrow keys. */
export function onMenuKeyDown(e: KeyboardEvent<HTMLElement>) {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return
  const options = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-option]"),
  )
  if (options.length === 0) return
  e.preventDefault()
  const at = options.indexOf(document.activeElement as HTMLButtonElement)
  const next =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? options.length - 1
        : e.key === "ArrowDown"
          ? (at + 1 + options.length) % options.length
          : (at - 1 + options.length) % options.length
  options[next]?.focus()
}
