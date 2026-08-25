import { useCallback, useRef, useState } from "react"

import { onMenuKeyDown, useDismiss } from "../lib/menu"
import { short } from "../lib/format"
import { PRESET_TOKENS, presetFor } from "../tokens"
import { Check, ChevronDown } from "./Icon"
import { TokenLogo } from "./TokenLogo"
import { UnverifiedBadge } from "./UnverifiedBadge"
import { VerifiedBadge } from "./VerifiedBadge"

export type TokenPick = `0x${string}` | "custom"

export function TokenSelect({
  pick,
  customAddress,
  customSymbol,
  network,
  onPick,
}: {
  pick: TokenPick
  customAddress?: `0x${string}`
  customSymbol?: string
  network: string
  onPick: (p: TokenPick) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const preset = pick !== "custom" ? presetFor(pick) : undefined
  const label = preset?.symbol ?? customSymbol ?? "Custom token"
  const sub =
    pick === "custom"
      ? customAddress
        ? short(customAddress)
        : "Paste an address"
      : (preset?.name ?? network)

  return (
    <div className="select" ref={ref}>
      <button
        type="button"
        className="select-trigger lg"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <TokenLogo address={pick === "custom" ? customAddress : pick} symbol={label} size={24} />
        <span className="token-identity">
          <span>
            <span className="sym">
              {label}
              {preset ? (
                <VerifiedBadge size={14} />
              ) : pick === "custom" && customAddress ? (
                <UnverifiedBadge size={14} />
              ) : null}
            </span>
            <span className="net">{sub}</span>
          </span>
        </span>
        <ChevronDown size={16} className="caret" />
      </button>

      <div
        className="select-menu"
        role="listbox"
        data-state={open ? "open" : "closed"}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
      >
        {PRESET_TOKENS.map((t) => (
          <button
            type="button"
            key={t.address}
            data-option
            role="option"
            aria-selected={pick === t.address}
            className="select-option"
            onClick={() => {
              onPick(t.address)
              close()
            }}
          >
            <TokenLogo address={t.address} symbol={t.symbol} size={24} />
            <span className="token-identity">
              <span>
                <span className="sym">
                  {t.symbol}
                  <VerifiedBadge size={13} />
                </span>
                <span className="net">{t.name}</span>
              </span>
            </span>
            <Check size={16} className="check" />
          </button>
        ))}
        {/* Reserved positions for future verified markets. */}
        {[88, 72, 96, 64].map((w, i) => (
          <div key={`future-${i}`} className="select-option placeholder" aria-hidden="true">
            <span
              className="skeleton"
              style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0 }}
            />
            <span className="token-identity">
              <span>
                <span
                  className="skeleton"
                  style={{ width: w, height: 10, display: "block", marginBottom: 6 }}
                />
                <span className="skeleton" style={{ width: 48, height: 8, display: "block" }} />
              </span>
            </span>
          </div>
        ))}
        <button
          type="button"
          data-option
          role="option"
          aria-selected={pick === "custom"}
          className="select-option"
          onClick={() => {
            onPick("custom")
            close()
          }}
        >
          <span className="token-fallback" style={{ width: 24, height: 24, fontSize: 10 }}>
            0x
          </span>
          <span className="token-identity">
            <span>
              <span className="sym">Custom token</span>
              <span className="net">Paste any contract address</span>
            </span>
          </span>
          <Check size={16} className="check" />
        </button>
      </div>
    </div>
  )
}
