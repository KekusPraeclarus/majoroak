import {
  addr,
  STATE,
  ZERO,
  type DealRow,
  type QuoteTotals,
  type Store,
  type WalletRole,
} from "./types"

type D1Like = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T>(): Promise<T | null>
      all<T>(): Promise<{ results: T[] }>
      run(): Promise<unknown>
    }
  }
}

type DealSql = {
  escrow: string
  seller: string
  base_token: string
  quote_token: string
  base_amount: string
  quote_amount: string
  allowed_payer: string
  expiry: number
  fee_amount: string
  state: number
  created_block: number
  created_tx: string
  created_log_index: number
  payer: string | null
  updated_block: number
}

function fromSql(row: DealSql): DealRow {
  return {
    escrow: row.escrow,
    seller: row.seller,
    baseToken: row.base_token,
    quoteToken: row.quote_token,
    baseAmount: row.base_amount,
    quoteAmount: row.quote_amount,
    allowedPayer: row.allowed_payer,
    expiry: row.expiry,
    feeAmount: row.fee_amount,
    state: row.state,
    createdBlock: row.created_block,
    createdTx: row.created_tx,
    createdLogIndex: row.created_log_index,
    payer: row.payer,
    updatedBlock: row.updated_block,
  }
}

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

export class D1Store implements Store {
  constructor(private readonly db: D1Like) {}

  async getCursor(): Promise<number | null> {
    const row = await this.db.prepare("SELECT block FROM cursor WHERE id = 1").bind().first<{ block: number }>()
    return row ? row.block : null
  }

  async setCursor(block: number, updatedAt: number): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO cursor (id, block, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET block = excluded.block, updated_at = excluded.updated_at",
      )
      .bind(block, updatedAt)
      .run()
  }

  async hasLog(logId: string): Promise<boolean> {
    const row = await this.db
      .prepare("SELECT 1 AS ok FROM processed_logs WHERE log_id = ?")
      .bind(logId)
      .first<{ ok: number }>()
    return !!row
  }

  async markLog(logId: string, block: number): Promise<void> {
    await this.db
      .prepare("INSERT OR IGNORE INTO processed_logs (log_id, block) VALUES (?, ?)")
      .bind(logId, block)
      .run()
  }

  async upsertDeal(deal: DealRow): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO deals (
          escrow, seller, base_token, quote_token, base_amount, quote_amount,
          allowed_payer, expiry, fee_amount, state, created_block, created_tx,
          created_log_index, payer, updated_block
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(escrow) DO UPDATE SET
          seller = excluded.seller,
          base_token = excluded.base_token,
          quote_token = excluded.quote_token,
          base_amount = excluded.base_amount,
          quote_amount = excluded.quote_amount,
          allowed_payer = excluded.allowed_payer,
          expiry = excluded.expiry,
          fee_amount = excluded.fee_amount,
          state = excluded.state,
          payer = excluded.payer,
          updated_block = excluded.updated_block`,
      )
      .bind(
        deal.escrow,
        deal.seller,
        deal.baseToken,
        deal.quoteToken,
        deal.baseAmount,
        deal.quoteAmount,
        deal.allowedPayer,
        deal.expiry,
        deal.feeAmount,
        deal.state,
        deal.createdBlock,
        deal.createdTx,
        deal.createdLogIndex,
        deal.payer,
        deal.updatedBlock,
      )
      .run()
  }

  async getDeal(escrow: string): Promise<DealRow | null> {
    const row = await this.db
      .prepare("SELECT * FROM deals WHERE escrow = ?")
      .bind(addr(escrow))
      .first<DealSql>()
    return row ? fromSql(row) : null
  }

  async setDealState(
    escrow: string,
    state: number,
    payer: string | null,
    block: number,
  ): Promise<void> {
    await this.db
      .prepare("UPDATE deals SET state = ?, payer = ?, updated_block = ? WHERE escrow = ?")
      .bind(state, payer, block, addr(escrow))
      .run()
  }

  async addWallet(wallet: string, escrow: string, role: WalletRole): Promise<void> {
    await this.db
      .prepare("INSERT OR IGNORE INTO wallets (wallet, escrow, role) VALUES (?, ?, ?)")
      .bind(addr(wallet), addr(escrow), role)
      .run()
  }

  async listOpenEscrows(): Promise<string[]> {
    const rows = await this.db
      .prepare("SELECT escrow FROM deals WHERE state = ?")
      .bind(STATE.OPEN)
      .all<{ escrow: string }>()
    return rows.results.map((row) => row.escrow)
  }

  async stats(): Promise<{
    open: QuoteTotals
    settled: QuoteTotals
    uniqueWallets: number
  }> {
    const rows = await this.db
      .prepare("SELECT quote_token, quote_amount, state FROM deals")
      .bind()
      .all<{ quote_token: string, quote_amount: string, state: number }>()
    const open = emptyTotals()
    const settled = emptyTotals()
    for (const row of rows.results) {
      if (row.state === STATE.OPEN) addQuote(open, row.quote_token, row.quote_amount)
      if (row.state === STATE.SETTLED) addQuote(settled, row.quote_token, row.quote_amount)
    }
    const wallets = await this.db
      .prepare("SELECT DISTINCT wallet FROM wallets WHERE role IN ('seller', 'settled_payer')")
      .bind()
      .all<{ wallet: string }>()
    return { open, settled, uniqueWallets: wallets.results.length }
  }

  async markets(nowSec: number): Promise<DealRow[]> {
    const rows = await this.db
      .prepare(
        "SELECT * FROM deals WHERE state = ? AND allowed_payer = ? AND expiry > ? ORDER BY expiry ASC",
      )
      .bind(STATE.OPEN, ZERO, nowSec)
      .all<DealSql>()
    return rows.results.map(fromSql)
  }

  async dealsForWallet(wallet: string): Promise<Array<DealRow & { role: string }>> {
    const links = await this.db
      .prepare("SELECT escrow, role FROM wallets WHERE wallet = ?")
      .bind(addr(wallet))
      .all<{ escrow: string, role: string }>()
    const best = new Map<string, string>()
    for (const link of links.results) {
      const prev = best.get(link.escrow)
      if (!prev || roleRank(link.role) < roleRank(prev)) best.set(link.escrow, link.role)
    }
    const rows: Array<DealRow & { role: string }> = []
    for (const [escrow, role] of best) {
      const deal = await this.getDeal(escrow)
      if (deal) rows.push({ ...deal, role })
    }
    return rows.sort((a, b) => b.createdBlock - a.createdBlock)
  }

  async meta(): Promise<{ block: number, updatedAt: number }> {
    const row = await this.db
      .prepare("SELECT block, updated_at FROM cursor WHERE id = 1")
      .bind()
      .first<{ block: number, updated_at: number }>()
    return { block: row?.block ?? 0, updatedAt: row?.updated_at ?? 0 }
  }
}
