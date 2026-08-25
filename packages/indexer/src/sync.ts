import { CANCELLED, ESCROW_CREATED, SETTLED } from "./abi"
import { decodeCancelled, decodeCreated, decodeSettled } from "./decode"
import {
  addr,
  logId,
  STATE,
  ZERO,
  type DealRow,
  type Rpc,
  type Store,
  type SyncConfig,
} from "./types"

function sortLogs<T extends { blockNumber: bigint, logIndex: number }>(logs: T[]): T[] {
  return [...logs].sort((a, b) => {
    if (a.blockNumber === b.blockNumber) return a.logIndex - b.logIndex
    return a.blockNumber < b.blockNumber ? -1 : 1
  })
}

export async function applyCreated(
  store: Store,
  log: Parameters<typeof decodeCreated>[0],
  factory: string,
): Promise<boolean> {
  if (addr(log.address) !== addr(factory)) return false
  const id = logId(log.transactionHash, log.logIndex)
  if (await store.hasLog(id)) return false
  const event = decodeCreated(log)
  if (!event) return false
  const block = Number(log.blockNumber)
  const deal: DealRow = {
    escrow: event.escrow,
    seller: event.seller,
    baseToken: event.baseToken,
    quoteToken: event.quoteToken,
    baseAmount: event.baseAmount,
    quoteAmount: event.quoteAmount,
    allowedPayer: event.allowedPayer,
    expiry: event.expiry,
    feeAmount: event.feeAmount,
    state: STATE.OPEN,
    createdBlock: block,
    createdTx: log.transactionHash.toLowerCase(),
    createdLogIndex: log.logIndex,
    payer: null,
    updatedBlock: block,
  }
  await store.upsertDeal(deal)
  await store.addWallet(event.seller, event.escrow, "seller")
  if (event.allowedPayer !== ZERO) {
    await store.addWallet(event.allowedPayer, event.escrow, "reserved_payer")
  }
  await store.markLog(id, block)
  return true
}

export async function applySettled(store: Store, log: Parameters<typeof decodeSettled>[0]): Promise<boolean> {
  const event = decodeSettled(log)
  if (!event) return false
  const known = await store.getDeal(event.escrow)
  if (!known) return false
  const id = logId(log.transactionHash, log.logIndex)
  if (await store.hasLog(id)) return false
  const block = Number(log.blockNumber)
  await store.setDealState(event.escrow, STATE.SETTLED, event.payer, block)
  await store.addWallet(event.payer, event.escrow, "settled_payer")
  await store.markLog(id, block)
  return true
}

export async function applyCancelled(store: Store, log: Parameters<typeof decodeCancelled>[0]): Promise<boolean> {
  const event = decodeCancelled(log)
  if (!event) return false
  const known = await store.getDeal(event.escrow)
  if (!known) return false
  const id = logId(log.transactionHash, log.logIndex)
  if (await store.hasLog(id)) return false
  const block = Number(log.blockNumber)
  await store.setDealState(event.escrow, STATE.CANCELLED, known.payer, block)
  await store.markLog(id, block)
  return true
}

export async function reconcileOpen(store: Store, rpc: Rpc): Promise<number> {
  const open = await store.listOpenEscrows()
  if (open.length === 0) return 0
  const states = await rpc.readStates(open)
  let changed = 0
  for (const escrow of open) {
    const state = states.get(addr(escrow))
    if (state === undefined) continue
    if (state === STATE.OPEN) continue
    const deal = await store.getDeal(escrow)
    if (!deal) continue
    await store.setDealState(escrow, state, deal.payer, deal.updatedBlock)
    changed += 1
  }
  return changed
}

export type SyncResult = {
  fromBlock: string
  toBlock: string
  created: number
  settled: number
  cancelled: number
  reconciled: number
}

export async function syncRange(
  store: Store,
  rpc: Rpc,
  config: SyncConfig,
  fromBlock: bigint,
  toBlock: bigint,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<SyncResult> {
  const createdLogs = sortLogs(
    await rpc.getLogs({
      address: config.factory,
      topics: [ESCROW_CREATED],
      fromBlock,
      toBlock,
    }),
  )
  await rpc.readFeeDenominator(config.factory)
  let created = 0
  for (const log of createdLogs) {
    if (await applyCreated(store, log, config.factory)) {
      created += 1
    }
  }

  const terminalLogs = sortLogs(
    await rpc.getLogs({
      topics: [[SETTLED, CANCELLED]],
      fromBlock,
      toBlock,
    }),
  )
  let settled = 0
  let cancelled = 0
  for (const log of terminalLogs) {
    if (log.topics[0]?.toLowerCase() === SETTLED.toLowerCase()) {
      if (await applySettled(store, log)) settled += 1
    } else if (await applyCancelled(store, log)) {
      cancelled += 1
    }
  }

  const reconciled = await reconcileOpen(store, rpc)
  await store.setCursor(Number(toBlock), nowSec)
  return {
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    created,
    settled,
    cancelled,
    reconciled,
  }
}

export async function runSync(
  store: Store,
  rpc: Rpc,
  config: SyncConfig,
  nowSec = Math.floor(Date.now() / 1000),
): Promise<SyncResult[]> {
  const head = await rpc.getBlockNumber()
  if (head < config.confirmations) return []
  const confirmed = head - config.confirmations
  const stored = await store.getCursor()
  const start = stored === null
    ? config.startBlock
    : BigInt(Math.max(Number(config.startBlock), stored + 1 - Number(config.rewindBlocks)))
  if (start > confirmed) return []

  const results: SyncResult[] = []
  let from = start
  while (from <= confirmed) {
    const to = from + config.rangeSize - 1n > confirmed ? confirmed : from + config.rangeSize - 1n
    results.push(await syncRange(store, rpc, config, from, to, nowSec))
    from = to + 1n
  }
  return results
}
