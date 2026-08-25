import { getAbiItem } from "viem"
import type { PublicClient } from "viem"

import { escrowAbi, factoryAbi } from "../abi"
import { FACTORY_ADDRESS, START_BLOCK } from "../config"
import { ZERO } from "./format"
import type { IndexedDeal, IndexerStats, QuoteKind } from "./discovery"

const escrowCreatedEvent = getAbiItem({ abi: factoryAbi, name: "EscrowCreated" })
const settledEvent = getAbiItem({ abi: escrowAbi, name: "Settled" })
const cancelledEvent = getAbiItem({
  abi: [
    {
      type: "event",
      name: "Cancelled",
      inputs: [
        { name: "seller", type: "address", indexed: true },
        { name: "baseOut", type: "uint256", indexed: false },
      ],
    },
  ] as const,
  name: "Cancelled",
})

const OPEN = 1
const SETTLED = 2
const CANCELLED = 3

function kindOf(quoteToken: string): QuoteKind {
  return quoteToken === ZERO ? "ETH" : "USDG"
}

export async function scanFactoryDeals(client: PublicClient): Promise<{
  stats: IndexerStats
  markets: IndexedDeal[]
  deals: IndexedDeal[]
}> {
  const created = await client.getLogs({
    address: FACTORY_ADDRESS,
    event: escrowCreatedEvent,
    fromBlock: START_BLOCK,
    toBlock: "latest",
  })
  const escrows = created
    .map((log) => log.args.escrow)
    .filter((value): value is `0x${string}` => !!value)

  const states =
    escrows.length === 0
      ? []
      : await client.multicall({
          contracts: escrows.map((address) => ({
            address,
            abi: escrowAbi,
            functionName: "state" as const,
          })),
          allowFailure: true,
        })

  const settled =
    escrows.length === 0
      ? []
      : await client.getLogs({
          address: escrows,
          event: settledEvent,
          fromBlock: START_BLOCK,
          toBlock: "latest",
        })

  const cancelled =
    escrows.length === 0
      ? []
      : await client.getLogs({
          address: escrows,
          event: cancelledEvent,
          fromBlock: START_BLOCK,
          toBlock: "latest",
        })

  const payerByEscrow = new Map<string, `0x${string}`>()
  for (const log of settled) {
    if (log.args.payer) payerByEscrow.set(log.address.toLowerCase(), log.args.payer)
  }
  const cancelledSet = new Set(cancelled.map((log) => log.address.toLowerCase()))

  const deals: IndexedDeal[] = created.map((log, i) => {
    const escrow = log.args.escrow!
    const quoteToken = (log.args.quoteToken ?? ZERO) as `0x${string}`
    const readState = states[i]?.status === "success" ? Number(states[i].result) : undefined
    let state = readState ?? OPEN
    if (payerByEscrow.has(escrow.toLowerCase())) state = SETTLED
    if (cancelledSet.has(escrow.toLowerCase())) state = CANCELLED
    const expiry = log.args.expiry !== undefined ? Number(log.args.expiry) : 0
    return {
      escrow,
      seller: log.args.seller!,
      baseToken: log.args.baseToken!,
      quoteToken,
      baseAmount: (log.args.baseAmount ?? 0n).toString(),
      quoteAmount: (log.args.quoteAmount ?? 0n).toString(),
      quoteKind: kindOf(quoteToken),
      allowedPayer: (log.args.allowedPayer ?? ZERO) as `0x${string}`,
      expiry,
      state,
      payer: payerByEscrow.get(escrow.toLowerCase()) ?? null,
    }
  })

  const now = Math.floor(Date.now() / 1000)
  const openEth = deals
    .filter((deal) => deal.state === OPEN && deal.quoteKind === "ETH")
    .reduce((sum, deal) => sum + BigInt(deal.quoteAmount), 0n)
  const openUsdg = deals
    .filter((deal) => deal.state === OPEN && deal.quoteKind === "USDG")
    .reduce((sum, deal) => sum + BigInt(deal.quoteAmount), 0n)
  const settledEth = deals
    .filter((deal) => deal.state === SETTLED && deal.quoteKind === "ETH")
    .reduce((sum, deal) => sum + BigInt(deal.quoteAmount), 0n)
  const settledUsdg = deals
    .filter((deal) => deal.state === SETTLED && deal.quoteKind === "USDG")
    .reduce((sum, deal) => sum + BigInt(deal.quoteAmount), 0n)

  const wallets = new Set<string>()
  for (const deal of deals) {
    wallets.add(deal.seller.toLowerCase())
    if (deal.payer) wallets.add(deal.payer.toLowerCase())
  }

  return {
    stats: {
      open: { eth: openEth.toString(), usdg: openUsdg.toString() },
      settled: { eth: settledEth.toString(), usdg: settledUsdg.toString() },
      uniqueWallets: wallets.size,
      indexedBlock: 0,
      updatedAt: now,
    },
    markets: deals.filter(
      (deal) =>
        deal.state === OPEN &&
        deal.allowedPayer === ZERO &&
        deal.expiry > now,
    ),
    deals,
  }
}
