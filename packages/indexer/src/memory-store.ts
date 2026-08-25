import {
  addr,
  STATE,
  ZERO,
  type DealRow,
  type QuoteTotals,
  type Store,
  type WalletRole,
} from "./types"

function emptyTotals(): QuoteTotals {
  return { eth: "0", usdg: "0" }
}

function addQuote(totals: QuoteTotals, quoteToken: string, amount: string): void {
  const key = quoteToken === ZERO ? "eth" : "usdg"
  totals[key] = (BigInt(totals[key]) + BigInt(amount)).toString()
}

function roleRank(role: string): number {
  if (role === "seller") return 0
  if (role === "settled_payer") return 1
  return 2
}

export class MemoryStore implements Store {
  cursor: number | null = null
  updatedAt = 0
  deals = new Map<string, DealRow>()
  logs = new Set<string>()
  wallets = new Map<string, Set<string>>()

  async getCursor(): Promise<number | null> {
    return this.cursor
  }

  async setCursor(block: number, updatedAt: number): Promise<void> {
    this.cursor = block
    this.updatedAt = updatedAt
  }

  async hasLog(logId: string): Promise<boolean> {
    return this.logs.has(logId)
  }

  async markLog(id: string, _block: number): Promise<void> {
    this.logs.add(id)
  }

  async upsertDeal(deal: DealRow): Promise<void> {
    this.deals.set(deal.escrow, { ...deal })
  }

  async getDeal(escrow: string): Promise<DealRow | null> {
    return this.deals.get(addr(escrow)) ?? null
  }

  async setDealState(
    escrow: string,
    state: number,
    payer: string | null,
    block: number,
  ): Promise<void> {
    const row = this.deals.get(addr(escrow))
    if (!row) return
    row.state = state
    row.payer = payer
    row.updatedBlock = block
  }

  async addWallet(wallet: string, escrow: string, role: WalletRole): Promise<void> {
    const key = `${addr(wallet)}|${addr(escrow)}|${role}`
    if (!this.wallets.has(addr(wallet))) this.wallets.set(addr(wallet), new Set())
    this.wallets.get(addr(wallet))!.add(key)
  }

  async listOpenEscrows(): Promise<string[]> {
    return [...this.deals.values()]
      .filter((deal) => deal.state === STATE.OPEN)
      .map((deal) => deal.escrow)
  }

  async stats(): Promise<{
    open: QuoteTotals
    settled: QuoteTotals
    uniqueWallets: number
  }> {
    const open = emptyTotals()
    const settled = emptyTotals()
    for (const deal of this.deals.values()) {
      if (deal.state === STATE.OPEN) addQuote(open, deal.quoteToken, deal.quoteAmount)
      if (deal.state === STATE.SETTLED) addQuote(settled, deal.quoteToken, deal.quoteAmount)
    }
    const unique = new Set<string>()
    for (const keys of this.wallets.values()) {
      for (const key of keys) {
        const [wallet, , role] = key.split("|")
        if (role === "seller" || role === "settled_payer") unique.add(wallet)
      }
    }
    return { open, settled, uniqueWallets: unique.size }
  }

  async markets(nowSec: number): Promise<DealRow[]> {
    return [...this.deals.values()]
      .filter(
        (deal) =>
          deal.state === STATE.OPEN &&
          deal.allowedPayer === ZERO &&
          deal.expiry > nowSec,
      )
      .sort((a, b) => a.expiry - b.expiry)
  }

  async dealsForWallet(wallet: string): Promise<Array<DealRow & { role: string }>> {
    const keys = this.wallets.get(addr(wallet))
    if (!keys) return []
    const best = new Map<string, string>()
    for (const key of keys) {
      const [, escrow, role] = key.split("|")
      const prev = best.get(escrow)
      if (!prev || roleRank(role) < roleRank(prev)) best.set(escrow, role)
    }
    const rows: Array<DealRow & { role: string }> = []
    for (const [escrow, role] of best) {
      const deal = this.deals.get(escrow)
      if (deal) rows.push({ ...deal, role })
    }
    return rows.sort((a, b) => b.createdBlock - a.createdBlock)
  }

  async meta(): Promise<{ block: number, updatedAt: number }> {
    return { block: this.cursor ?? 0, updatedAt: this.updatedAt }
  }
}
