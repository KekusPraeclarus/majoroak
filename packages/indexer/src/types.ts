export const ZERO = "0x0000000000000000000000000000000000000000"

export const STATE = {
  CREATED: 0,
  OPEN: 1,
  SETTLED: 2,
  CANCELLED: 3,
} as const

export type WalletRole = "seller" | "reserved_payer" | "settled_payer"

export type DealRow = {
  escrow: string
  seller: string
  baseToken: string
  quoteToken: string
  baseAmount: string
  quoteAmount: string
  allowedPayer: string
  expiry: number
  feeAmount: string
  state: number
  createdBlock: number
  createdTx: string
  createdLogIndex: number
  payer: string | null
  updatedBlock: number
}

export type QuoteKind = "ETH" | "USDG"

export type QuoteTotals = {
  eth: string
  usdg: string
}

export type StatsResponse = {
  open: QuoteTotals
  settled: QuoteTotals
  uniqueWallets: number
  indexedBlock: number
  updatedAt: number
}

export type DealDto = {
  escrow: string
  seller: string
  baseToken: string
  quoteToken: string
  baseAmount: string
  quoteAmount: string
  quoteKind: QuoteKind
  allowedPayer: string
  expiry: number
  state: number
  payer: string | null
  role?: string
}

export type MarketsResponse = {
  deals: DealDto[]
  indexedBlock: number
}

export type WalletDealsResponse = {
  deals: DealDto[]
  indexedBlock: number
}

export type HealthResponse = {
  ok: boolean
  factory: string
  chainId: number
  indexedBlock: number
  headBlock: number | null
  lag: number | null
  updatedAt: number
}

export type SyncConfig = {
  factory: string
  startBlock: bigint
  confirmations: bigint
  rangeSize: bigint
  rewindBlocks: bigint
}

export type RawLog = {
  address: string
  topics: string[]
  data: string
  blockNumber: bigint
  transactionHash: string
  logIndex: number
}

export interface Rpc {
  getBlockNumber(): Promise<bigint>
  getLogs(args: {
    address?: string
    topics: (string | string[] | null)[]
    fromBlock: bigint
    toBlock: bigint
  }): Promise<RawLog[]>
  readStates(addresses: string[]): Promise<Map<string, number>>
  readFeeDenominator(factory: string): Promise<number>
}

export interface Store {
  getCursor(): Promise<number | null>
  setCursor(block: number, updatedAt: number): Promise<void>
  hasLog(logId: string): Promise<boolean>
  markLog(logId: string, block: number): Promise<void>
  upsertDeal(deal: DealRow): Promise<void>
  getDeal(escrow: string): Promise<DealRow | null>
  setDealState(
    escrow: string,
    state: number,
    payer: string | null,
    block: number,
  ): Promise<void>
  addWallet(wallet: string, escrow: string, role: WalletRole): Promise<void>
  listOpenEscrows(): Promise<string[]>
  stats(): Promise<{
    open: QuoteTotals
    settled: QuoteTotals
    uniqueWallets: number
  }>
  markets(nowSec: number): Promise<DealRow[]>
  dealsForWallet(wallet: string): Promise<Array<DealRow & { role: string }>>
  meta(): Promise<{ block: number, updatedAt: number }>
}

export function quoteKind(quoteToken: string): QuoteKind {
  return quoteToken === ZERO ? "ETH" : "USDG"
}

export function logId(tx: string, index: number): string {
  return `${tx.toLowerCase()}:${index}`
}

export function addr(value: string): string {
  return value.toLowerCase()
}
