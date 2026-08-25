import {
  quoteKind,
  type DealDto,
  type DealRow,
  type HealthResponse,
  type MarketsResponse,
  type StatsResponse,
  type Store,
  type WalletDealsResponse,
} from "./types"

function toDto(deal: DealRow, role?: string): DealDto {
  return {
    escrow: deal.escrow,
    seller: deal.seller,
    baseToken: deal.baseToken,
    quoteToken: deal.quoteToken,
    baseAmount: deal.baseAmount,
    quoteAmount: deal.quoteAmount,
    quoteKind: quoteKind(deal.quoteToken),
    allowedPayer: deal.allowedPayer,
    expiry: deal.expiry,
    state: deal.state,
    payer: deal.payer,
    ...(role ? { role } : {}),
  }
}

export async function statsResponse(store: Store): Promise<StatsResponse> {
  const [totals, meta] = await Promise.all([store.stats(), store.meta()])
  return {
    open: totals.open,
    settled: totals.settled,
    uniqueWallets: totals.uniqueWallets,
    indexedBlock: meta.block,
    updatedAt: meta.updatedAt,
  }
}

export async function marketsResponse(
  store: Store,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<MarketsResponse> {
  const [deals, meta] = await Promise.all([store.markets(nowSec), store.meta()])
  return {
    deals: deals.map((deal) => toDto(deal)),
    indexedBlock: meta.block,
  }
}

export async function walletDealsResponse(
  store: Store,
  wallet: string,
): Promise<WalletDealsResponse> {
  const [deals, meta] = await Promise.all([store.dealsForWallet(wallet), store.meta()])
  return {
    deals: deals.map((deal) => toDto(deal, deal.role)),
    indexedBlock: meta.block,
  }
}

export async function healthResponse(
  store: Store,
  factory: string,
  chainId: number,
  headBlock: number | null,
): Promise<HealthResponse> {
  const meta = await store.meta()
  return {
    ok: true,
    factory,
    chainId,
    indexedBlock: meta.block,
    headBlock,
    lag: headBlock === null ? null : Math.max(0, headBlock - meta.block),
    updatedAt: meta.updatedAt,
  }
}

export function json(data: unknown, origin: string, status = 200, cache = "public, max-age=15"): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cache,
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  })
}

export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value)
}
