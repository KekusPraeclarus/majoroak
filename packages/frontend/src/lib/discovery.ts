import { useQuery } from "@tanstack/react-query"

import { INDEXER_FALLBACK, INDEXER_URL } from "../config"
import { isAddress } from "./format"

export type QuoteKind = "ETH" | "USDG"

export type QuoteTotals = {
  eth: string
  usdg: string
}

export type IndexerStats = {
  open: QuoteTotals
  settled: QuoteTotals
  uniqueWallets: number
  indexedBlock: number
  updatedAt: number
}

export type IndexedDeal = {
  escrow: `0x${string}`
  seller: `0x${string}`
  baseToken: `0x${string}`
  quoteToken: `0x${string}`
  baseAmount: string
  quoteAmount: string
  quoteKind: QuoteKind
  allowedPayer: `0x${string}`
  expiry: number
  state: number
  payer: `0x${string}` | null
  role?: string
}

export function indexerConfigured(): boolean {
  return INDEXER_URL.length > 0
}

export function discoveryAvailable(): boolean {
  return indexerConfigured() || INDEXER_FALLBACK
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${INDEXER_URL}${path}`)
  if (!res.ok) throw new Error(`Indexer ${res.status}`)
  return res.json() as Promise<T>
}

export function useIndexerStats(enabled: boolean) {
  return useQuery({
    queryKey: ["indexer-stats", INDEXER_URL],
    enabled: enabled && indexerConfigured(),
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: () => getJson<IndexerStats>("/v1/stats"),
  })
}

export function useIndexerMarkets(enabled: boolean) {
  return useQuery({
    queryKey: ["indexer-markets", INDEXER_URL],
    enabled: enabled && indexerConfigured(),
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const body = await getJson<{ deals: IndexedDeal[] }>("/v1/markets")
      return body.deals
    },
  })
}

export function useIndexerWalletDeals(wallet: string | undefined, enabled: boolean) {
  const valid = !!wallet && isAddress(wallet)
  return useQuery({
    queryKey: ["indexer-deals", INDEXER_URL, wallet?.toLowerCase()],
    enabled: enabled && indexerConfigured() && valid,
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const body = await getJson<{ deals: IndexedDeal[] }>(`/v1/deals?wallet=${wallet}`)
      return body.deals
    },
  })
}

export function quoteUnits(amount: string, kind: QuoteKind): number {
  const decimals = kind === "ETH" ? 18n : 6n
  const raw = BigInt(amount)
  const base = 10n ** decimals
  const whole = raw / base
  const frac = raw % base
  return Number(whole) + Number(frac) / Number(base)
}

export function quoteUsd(amount: string, kind: QuoteKind, ethUsd: number | undefined): {
  usd: number
  priced: boolean
} {
  const units = quoteUnits(amount, kind)
  if (kind === "USDG") return { usd: units, priced: true }
  if (ethUsd === undefined) return { usd: 0, priced: false }
  return { usd: units * ethUsd, priced: true }
}

export function addQuoteUsd(
  totals: QuoteTotals,
  ethUsd: number | undefined,
): { usd: number, priced: boolean } {
  const eth = quoteUsd(totals.eth, "ETH", ethUsd)
  const usdg = quoteUsd(totals.usdg, "USDG", ethUsd)
  return { usd: eth.usd + usdg.usd, priced: eth.priced }
}
