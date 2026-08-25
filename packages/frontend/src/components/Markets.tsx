import { useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { usePublicClient, useReadContracts } from "wagmi"

import { erc20Abi } from "../abi"
import { FACTORY_DEPLOYED, INDEXER_FALLBACK } from "../config"
import { DEMO_MARKETS, IS_DEMO, type DemoDeal } from "../demo"
import { indexerConfigured, quoteUsd, useIndexerMarkets, type IndexedDeal } from "../lib/discovery"
import { scanFactoryDeals } from "../lib/discovery-rpc"
import { fmtAmount, fmtCountdown, countdownUrgent, short } from "../lib/format"
import { onMenuKeyDown, useDismiss } from "../lib/menu"
import { useEthUsd } from "../lib/prices"
import { PRESET_TOKENS, presetFor } from "../tokens"
import { Check, ChevronDown } from "./Icon"
import { Notice } from "./Notice"
import { StatusChip } from "./StatusChip"
import { TokenLogo } from "./TokenLogo"
import { UnverifiedBadge } from "./UnverifiedBadge"
import { VerifiedBadge } from "./VerifiedBadge"

type MarketRow = DemoDeal & { symbol: string }

function toRow(deal: IndexedDeal, ethUsd: number | undefined): MarketRow {
  const priced = quoteUsd(deal.quoteAmount, deal.quoteKind, ethUsd)
  return {
    escrow: deal.escrow,
    seller: deal.seller,
    baseToken: deal.baseToken,
    baseAmount: BigInt(deal.baseAmount),
    quoteKind: deal.quoteKind,
    quoteAmount: BigInt(deal.quoteAmount),
    quoteDecimals: deal.quoteKind === "ETH" ? 18 : 6,
    allowedPayer: deal.allowedPayer,
    expiry: BigInt(deal.expiry),
    state: deal.state,
    usdValue: priced.usd,
    symbol: presetFor(deal.baseToken)?.symbol ?? "TOKEN",
  }
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const current = options.find((o) => o.value === value)
  const active = value !== "all"

  return (
    <div className="select" ref={ref}>
      <button
        type="button"
        className="filter-chip"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-pressed={active}
        onClick={() => setOpen((o) => !o)}
      >
        {active ? current?.label : label}
        <ChevronDown size={16} className="caret" />
      </button>
      <div
        className="select-menu"
        role="listbox"
        data-state={open ? "open" : "closed"}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
      >
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            data-option
            role="option"
            aria-selected={o.value === value}
            className="select-option"
            onClick={() => {
              onChange(o.value)
              close()
            }}
          >
            <span className="select-value">{o.label}</span>
            <Check size={16} className="check" />
          </button>
        ))}
      </div>
    </div>
  )
}

function useMarkets(): { rows: MarketRow[]; loading: boolean; unavailable: boolean } {
  const publicClient = usePublicClient()
  const ethUsd = useEthUsd()
  const useApi = !IS_DEMO && FACTORY_DEPLOYED && indexerConfigured()
  const useFallback = !IS_DEMO && FACTORY_DEPLOYED && !useApi && INDEXER_FALLBACK && !!publicClient

  const api = useIndexerMarkets(useApi)
  const fallback = useQuery({
    queryKey: ["markets-fallback"],
    enabled: useFallback,
    staleTime: 30_000,
    refetchInterval: 30_000,
    queryFn: async () => (await scanFactoryDeals(publicClient!)).markets,
  })

  if (IS_DEMO || !FACTORY_DEPLOYED) {
    return {
      rows: DEMO_MARKETS.map((d) => ({
        ...d,
        symbol: presetFor(d.baseToken)?.symbol ?? "TOKEN",
      })),
      loading: false,
      unavailable: false,
    }
  }

  const deals = useApi ? api.data : fallback.data
  const loading = useApi ? api.isLoading : fallback.isLoading
  if (!useApi && !useFallback) return { rows: [], loading: false, unavailable: true }
  if (!deals) return { rows: [], loading, unavailable: false }
  return {
    rows: deals.map((deal) => toRow(deal, ethUsd)),
    loading: false,
    unavailable: useApi ? api.isError : fallback.isError,
  }
}

const COLUMNS = 7

/**
 * Browse-table amounts trim to four decimals; a value too small for that keeps
 * its first two significant digits instead, so no nonzero amount reads as zero.
 * The deal page keeps full precision.
 */
function fmtCellAmount(value: bigint, decimals = 18): string {
  const [int, fracRaw = ""] = fmtAmount(value, decimals).split(".")
  const frac = fracRaw.replace(/0+$/, "")
  if (!frac) return int
  const four = frac.slice(0, 4).replace(/0+$/, "")
  if (int !== "0" || four !== "") return four ? `${int}.${four}` : int
  const sig = frac.match(/^(0*)([1-9]\d?)/)
  if (!sig || sig[1].length >= 8) return "< 0.00000001"
  return `0.${(sig[1] + sig[2]).slice(0, 9)}`
}

/** USD value with cents for small figures, so a small deal never reads as zero. */
function fmtCellUsd(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "—"
  if (usd >= 1000) return `$${usd.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  if (usd >= 0.01) return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return "< $0.01"
}

/**
 * Resolve on-chain symbols for base tokens that are not on the official list,
 * so unverified markets read as themselves instead of a placeholder.
 */
function useUnlistedSymbols(rows: MarketRow[]): Map<string, string> {
  const unlisted = useMemo(
    () =>
      [...new Set(rows.map((r) => r.baseToken.toLowerCase()))].filter(
        (address) => !presetFor(address),
      ) as `0x${string}`[],
    [rows],
  )
  const reads = useReadContracts({
    contracts: unlisted.map((address) => ({
      address,
      abi: erc20Abi,
      functionName: "symbol" as const,
    })),
    query: { enabled: unlisted.length > 0, staleTime: Infinity },
  })
  return useMemo(() => {
    const map = new Map<string, string>()
    unlisted.forEach((address, i) => {
      const symbol = reads.data?.[i]?.result
      if (typeof symbol === "string" && symbol.length > 0) map.set(address, symbol.slice(0, 12))
    })
    return map
  }, [unlisted, reads.data])
}

export function MarketsSection() {
  const { rows: rawRows, loading, unavailable } = useMarkets()
  const unlistedSymbols = useUnlistedSymbols(rawRows)
  const rows = useMemo(
    () =>
      rawRows.map((r) =>
        presetFor(r.baseToken)
          ? r
          : {
              ...r,
              symbol: unlistedSymbols.get(r.baseToken.toLowerCase()) ?? short(r.baseToken),
            },
      ),
    [rawRows, unlistedSymbols],
  )
  const navigate = useNavigate()
  const [token, setToken] = useState("all")
  const [quote, setQuote] = useState("all")
  const [size, setSize] = useState("all")
  const [expiry, setExpiry] = useState("all")
  const [addrFilter, setAddrFilter] = useState("")
  const [, tick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  const addrFilterValid = /^0x[0-9a-fA-F]{40}$/.test(addrFilter.trim())

  function clearFilters() {
    setToken("all")
    setQuote("all")
    setSize("all")
    setExpiry("all")
    setAddrFilter("")
  }

  const filtered = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000)
    return rows
      .filter((r) =>
        addrFilterValid
          ? r.baseToken.toLowerCase() === addrFilter.trim().toLowerCase()
          : token === "all" || r.baseToken.toLowerCase() === token,
      )
      .filter((r) => quote === "all" || r.quoteKind === quote)
      .filter((r) => {
        if (size === "s") return r.usdValue < 5_000
        if (size === "m") return r.usdValue >= 5_000 && r.usdValue < 25_000
        if (size === "l") return r.usdValue >= 25_000
        return true
      })
      .filter((r) => {
        const hrs = (Number(r.expiry) - nowSec) / 3600
        if (expiry === "h24") return hrs < 24
        if (expiry === "d3") return hrs >= 24 && hrs < 72
        if (expiry === "d3plus") return hrs >= 72
        return true
      })
      .sort((a, b) => Number(a.expiry - b.expiry))
  }, [rows, token, quote, size, expiry, addrFilter, addrFilterValid])

  return (
    <>
      <div className="page-head">
        <div className="title-row">
          <h1 className="page-title">
            Open deals
            {IS_DEMO && <span className="demo-tag">demo data</span>}
          </h1>
        </div>
        <p className="page-sub">
          Every deal here is funded. The asset sits in escrow until it settles or expires.
        </p>
      </div>

      <div className="filter-bar">
        <FilterSelect
          label="Token"
          value={token}
          onChange={setToken}
          options={[
            { value: "all", label: "All tokens" },
            ...PRESET_TOKENS.map((t) => ({ value: t.address.toLowerCase(), label: t.symbol })),
            // Unverified tokens with open deals are selectable too.
            ...[...new Set(
              rows
                .map((r) => r.baseToken.toLowerCase())
                .filter((address) => !presetFor(address)),
            )].map((address) => ({
              value: address,
              label: `${rows.find((r) => r.baseToken.toLowerCase() === address)?.symbol ?? short(address)} · unverified`,
            })),
          ]}
        />
        <FilterSelect
          label="Payment"
          value={quote}
          onChange={setQuote}
          options={[
            { value: "all", label: "Any payment" },
            { value: "ETH", label: "ETH" },
            { value: "USDG", label: "USDG" },
          ]}
        />
        <FilterSelect
          label="Size"
          value={size}
          onChange={setSize}
          options={[
            { value: "all", label: "Any size" },
            { value: "s", label: "Under $5K" },
            { value: "m", label: "$5K to $25K" },
            { value: "l", label: "Over $25K" },
          ]}
        />
        <FilterSelect
          label="Expiry"
          value={expiry}
          onChange={setExpiry}
          options={[
            { value: "all", label: "Any expiry" },
            { value: "h24", label: "Under 24 hours" },
            { value: "d3", label: "1 to 3 days" },
            { value: "d3plus", label: "Over 3 days" },
          ]}
        />
        <div className={`input filter-search${addrFilter && !addrFilterValid ? " err" : ""}`}>
          <input
            placeholder="Paste a token contract"
            aria-label="Filter by token contract"
            autoComplete="off"
            spellCheck={false}
            value={addrFilter}
            onChange={(e) => setAddrFilter(e.target.value)}
          />
        </div>
        <span className="filter-count">
          {filtered.length} {filtered.length === 1 ? "deal" : "deals"}
        </span>
      </div>

      {unavailable ? (
        <Notice kind="warn" title="We cannot read the market.">
          Your funds are not affected. Try again in a moment.
        </Notice>
      ) : filtered.length === 0 && !loading ? (
        <div className="empty">
          <span className="lozenge" aria-hidden="true" />
          {rows.length === 0 ? (
            <p>No open deals. A deal appears here after a seller funds an escrow.</p>
          ) : (
            <>
              <p>No deal matches these filters.</p>
              <button type="button" className="btn secondary" onClick={clearFilters}>
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="table-frame">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col" className="num">
                  Amount offered
                </th>
                <th scope="col" className="num">
                  Quote asked
                </th>
                <th scope="col" className="num">
                  Value
                </th>
                <th scope="col">Expires in</th>
                <th scope="col">Status</th>
                <th scope="col" className="act">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: COLUMNS }).map((__, c) => (
                        <td key={c}>
                          <span className="skeleton" />
                        </td>
                      ))}
                    </tr>
                  ))
                : filtered.map((r) => {
                    const preset = presetFor(r.baseToken)
                    return (
                      <tr
                        key={r.escrow}
                        className="row-link"
                        onClick={() => navigate(`/deal/${r.escrow}`)}
                      >
                        <td className="cell-token">
                          <Link to={`/deal/${r.escrow}`} onClick={(e) => e.stopPropagation()}>
                            <TokenLogo address={r.baseToken} symbol={r.symbol} size={28} />
                            <span>
                              <span className="sym">
                                {r.symbol}
                                {preset ? (
                                  <VerifiedBadge size={14} />
                                ) : (
                                  <UnverifiedBadge size={14} />
                                )}
                              </span>
                              <span className="sub">{preset?.name ?? short(r.baseToken)}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="num" data-label="Amount offered">
                          {fmtCellAmount(r.baseAmount)}
                        </td>
                        <td className="num" data-label="Quote asked">
                          {fmtCellAmount(r.quoteAmount, r.quoteDecimals)} {r.quoteKind}
                        </td>
                        <td className="num muted" data-label="Value">
                          ≈ {fmtCellUsd(r.usdValue)}
                        </td>
                        <td
                          className={`cell-expiry${countdownUrgent(r.expiry) ? " countdown-warn" : ""}`}
                          data-label="Expires in"
                        >
                          {fmtCountdown(r.expiry)}
                        </td>
                        <td className="cell-status">
                          <StatusChip label="Open" />
                        </td>
                        <td className="act">
                          <Link
                            className="btn sm secondary"
                            to={`/deal/${r.escrow}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View deal
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
