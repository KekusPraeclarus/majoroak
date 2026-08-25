import { useEffect, useRef, useState } from "react"

import { taxAcceptPhrase, taxQuarterPct } from "./tax"

export type TaxPreview =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "exact"; received: bigint }
  | { status: "taxed"; received: bigint; quarterPct: number; phrase: string }
  | { status: "revert" }
  | { status: "failed" }

export function useTaxPreview({
  expected,
  enabled,
  depsKey,
  run,
}: {
  expected?: bigint
  enabled: boolean
  depsKey: string
  run: () => Promise<bigint>
}): TaxPreview {
  const [preview, setPreview] = useState<TaxPreview>({ status: "idle" })
  const runRef = useRef(run)
  runRef.current = run

  useEffect(() => {
    if (!enabled || expected === undefined) {
      setPreview({ status: "idle" })
      return
    }
    let cancelled = false
    setPreview({ status: "loading" })
    const timer = window.setTimeout(() => {
      void runRef
        .current()
        .then((received) => {
          if (cancelled) return
          if (received >= expected) {
            setPreview({ status: "exact", received })
            return
          }
          const quarterPct = taxQuarterPct(expected, received)
          setPreview({
            status: "taxed",
            received,
            quarterPct,
            phrase: taxAcceptPhrase(quarterPct),
          })
        })
        .catch((e: unknown) => {
          if (cancelled) return
          const msg = e instanceof Error ? e.message : String(e)
          const revert = /revert|execution reverted|ExactAmountMismatch/i.test(msg)
          setPreview({ status: revert ? "revert" : "failed" })
        })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [enabled, expected, depsKey])

  return preview
}
