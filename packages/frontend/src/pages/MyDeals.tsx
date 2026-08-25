import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAccount, usePublicClient, useReadContracts, useWriteContract } from "wagmi"

import { erc20Abi, escrowAbi, ESCROW_STATES } from "../abi"
import { ConfirmModal } from "../components/Modal"
import { Notice } from "../components/Notice"
import { StatusChip } from "../components/StatusChip"
import { SuccessModal } from "../components/SuccessModal"
import { TokenLogo } from "../components/TokenLogo"
import { UnverifiedBadge } from "../components/UnverifiedBadge"
import { VerifiedBadge } from "../components/VerifiedBadge"
import { FACTORY_DEPLOYED, INDEXER_FALLBACK } from "../config"
import { DEMO_MY_DEALS, IS_DEMO } from "../demo"
import {
  indexerConfigured,
  quoteUsd,
  useIndexerWalletDeals,
  type IndexedDeal,
} from "../lib/discovery"
import { scanFactoryDeals } from "../lib/discovery-rpc"
import { fmtAmount, short } from "../lib/format"
import { useEthUsd } from "../lib/prices"
import { presetFor } from "../tokens"

type Row = {
  escrow: `0x${string}`
  baseToken: `0x${string}`
  baseAmount: bigint
  quoteSym: string
  quoteAmount: bigint
  quoteDecimals: number
  usdValue: number
  role: "seller" | "buyer"
  stateName: string
}

const demoRows: Row[] = DEMO_MY_DEALS.map((d) => {
  const expired = d.state === 1 && Number(d.expiry) <= Math.floor(Date.now() / 1000)
  return {
    escrow: d.escrow,
    baseToken: d.baseToken,
    baseAmount: d.baseAmount,
    quoteSym: d.quoteKind,
    quoteAmount: d.quoteAmount,
    quoteDecimals: d.quoteDecimals,
    usdValue: d.usdValue,
    role: d.role ?? "seller",
    stateName: expired ? "Expired" : ESCROW_STATES[d.state],
  }
})

/** Open first, then expired, then the closed states. */
const STATE_ORDER = ["Open", "Expired", "Created", "Settled", "Cancelled"] as const

const GROUP_LABEL: Record<string, string> = {
  Open: "Open",
  Expired: "Expired",
  Created: "Not funded",
  Settled: "Settled",
  Cancelled: "Cancelled",
}

const COLUMNS = 7

function roleOf(deal: IndexedDeal, account: string): "seller" | "buyer" {
  if (deal.seller.toLowerCase() === account.toLowerCase()) return "seller"
  return "buyer"
}

function toRow(deal: IndexedDeal, account: string, ethUsd: number | undefined): Row {
  const priced = quoteUsd(deal.quoteAmount, deal.quoteKind, ethUsd)
  const expired = deal.state === 1 && deal.expiry <= Math.floor(Date.now() / 1000)
  return {
    escrow: deal.escrow,
    baseToken: deal.baseToken,
    baseAmount: BigInt(deal.baseAmount),
    quoteSym: deal.quoteKind,
    quoteAmount: BigInt(deal.quoteAmount),
    quoteDecimals: deal.quoteKind === "ETH" ? 18 : 6,
    usdValue: priced.usd,
    role: roleOf(deal, account),
    stateName: expired ? "Expired" : (ESCROW_STATES[deal.state] ?? "…"),
  }
}

function roleText(r: Row): string {
  if (r.role === "seller") return r.stateName === "Settled" ? "You sold" : "You are selling"
  return r.stateName === "Settled" ? "You bought" : "Reserved for you"
}

export function MyDealsPage() {
  const { address: account } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const navigate = useNavigate()
  const ethUsd = useEthUsd()
  const demoMode = IS_DEMO || !FACTORY_DEPLOYED
  const [busy, setBusy] = useState("")
  const [note, setNote] = useState("")
  const [cancelled, setCancelled] = useState<string | null>(null)
  const [pending, setPending] = useState<`0x${string}` | null>(null)
  const useApi = !demoMode && indexerConfigured()
  const useFallback = !demoMode && !useApi && INDEXER_FALLBACK && !!publicClient && !!account

  const api = useIndexerWalletDeals(account, useApi && !!account)
  const fallback = useQuery({
    queryKey: ["my-deals-fallback", account],
    enabled: useFallback,
    staleTime: 30_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      const scanned = await scanFactoryDeals(publicClient!)
      const me = account!.toLowerCase()
      return scanned.deals.filter(
        (deal) =>
          deal.seller.toLowerCase() === me ||
          deal.allowedPayer.toLowerCase() === me ||
          deal.payer?.toLowerCase() === me,
      )
    },
  })

  const chainDeals = (useApi ? api.data : fallback.data) ?? []
  const dealsQuery = useApi ? api : fallback
  const discoveryMissing = !demoMode && !useApi && !useFallback

  const symbols = useReadContracts({
    contracts: chainDeals.map((d) => ({
      address: d.baseToken!,
      abi: erc20Abi,
      functionName: "symbol" as const,
    })),
    query: { enabled: chainDeals.length > 0 },
  })

  const rows: Row[] = demoMode
    ? demoRows
    : account
      ? chainDeals.map((deal) => toRow(deal, account, ethUsd))
      : []

  const symFor = (r: Row, i: number) =>
    demoMode
      ? (presetFor(r.baseToken)?.symbol ?? short(r.baseToken))
      : ((symbols.data?.[i]?.result as string | undefined) ?? short(r.baseToken))

  const pendingRow = pending ? rows.find((r) => r.escrow === pending) : undefined
  const reclaim = pendingRow?.stateName === "Expired"

  async function cancelDeal(escrow: `0x${string}`) {
    if (demoMode) {
      setNote(escrow)
      setTimeout(() => setNote(""), 1600)
      return
    }
    setBusy(escrow)
    try {
      const hash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "cancel",
      })
      await publicClient!.waitForTransactionReceipt({ hash })
      await dealsQuery.refetch()
      setCancelled(hash)
    } catch {
      /* the wallet rejected the call, or it reverted. The row does not change. */
    } finally {
      setBusy("")
    }
  }

  const groups = STATE_ORDER.map((state) => ({
    state,
    rows: rows.filter((r) => r.stateName === state),
  })).filter((g) => g.rows.length > 0)

  const loading = !demoMode && !!account && dealsQuery.isLoading

  return (
    <main className="page shell list-page" id="main">
      <SuccessModal
        open={!!cancelled}
        title="Tokens reclaimed"
        subtitle="The base asset is back in your wallet. The deal is closed."
        txHash={cancelled ?? undefined}
        onClose={() => setCancelled(null)}
      />

      <ConfirmModal
        open={!!pending}
        title={reclaim ? "Reclaim your tokens" : "Cancel this deal"}
        summary={
          pendingRow && (
            <div className="receipt">
              <div className="receipt-row">
                <span>Escrow</span>
                <span className="num mono">{short(pendingRow.escrow)}</span>
              </div>
              <div className="receipt-row total">
                <span>Returns to you</span>
                <span className="num">
                  {fmtAmount(pendingRow.baseAmount)}{" "}
                  {symFor(pendingRow, rows.indexOf(pendingRow))}
                </span>
              </div>
            </div>
          )
        }
        consequence="The deal closes and cannot reopen. You keep the base asset."
        confirmLabel={reclaim ? "Reclaim tokens" : "Cancel deal"}
        onConfirm={() => {
          const escrow = pending
          setPending(null)
          if (escrow) cancelDeal(escrow)
        }}
        onClose={() => setPending(null)}
      />

      <div className="page-head">
        <h1 className="page-title">
          My deals
          {demoMode && <span className="demo-tag">demo data</span>}
        </h1>
        <p className="page-sub">Deals you created, and deals reserved for your wallet.</p>
      </div>

      {discoveryMissing ? (
        <Notice kind="warn" title="We cannot read your deals.">
          Your funds are not affected. Try again in a moment.
        </Notice>
      ) : !demoMode && !account ? (
        <div className="empty">
          <span className="lozenge" aria-hidden="true" />
          <p>This list comes from the connected address. Connect a wallet to see your deals.</p>
        </div>
      ) : rows.length === 0 && !loading ? (
        <div className="empty">
          <span className="lozenge" aria-hidden="true" />
          <p>No deal for this address yet.</p>
          <Link className="btn secondary" to="/create">
            Create a deal
          </Link>
        </div>
      ) : (
        <div className="table-frame">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Your side</th>
                <th scope="col" className="num">
                  Amount
                </th>
                <th scope="col" className="num">
                  Quote asked
                </th>
                <th scope="col" className="num">
                  Value
                </th>
                <th scope="col">Status</th>
                <th scope="col" className="act">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>

            {loading ? (
              <tbody>
                {Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: COLUMNS }).map((__, c) => (
                      <td key={c}>
                        <span className="skeleton" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ) : (
              groups.map((group) => (
                <tbody key={group.state}>
                  <tr className="group-row">
                    <td colSpan={COLUMNS}>
                      <span className="group-label">{GROUP_LABEL[group.state]}</span>
                    </td>
                  </tr>
                  {group.rows.map((r) => {
                    const sym = symFor(r, rows.indexOf(r))
                    const canCancel =
                      r.role === "seller" && (r.stateName === "Open" || r.stateName === "Expired")
                    return (
                      <tr
                        key={r.escrow}
                        className="row-link"
                        onClick={() => navigate(`/deal/${r.escrow}`)}
                      >
                        <td className="cell-token">
                          <Link to={`/deal/${r.escrow}`} onClick={(e) => e.stopPropagation()}>
                            <TokenLogo address={r.baseToken} symbol={sym} size={28} />
                            <span>
                              <span className="sym">
                                {sym}
                                {presetFor(r.baseToken) ? (
                                  <VerifiedBadge size={14} />
                                ) : (
                                  <UnverifiedBadge size={14} />
                                )}
                              </span>
                              <span className="sub mono">{short(r.escrow)}</span>
                            </span>
                          </Link>
                        </td>
                        <td data-label="Your side">{roleText(r)}</td>
                        <td className="num" data-label="Amount">
                          {fmtAmount(r.baseAmount)}
                        </td>
                        <td className="num" data-label="Quote asked">
                          {fmtAmount(r.quoteAmount, r.quoteDecimals)} {r.quoteSym}
                        </td>
                        <td className="num muted" data-label="Value">
                          ≈ ${r.usdValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </td>
                        <td className="cell-status">
                          <StatusChip label={r.stateName} />
                        </td>
                        <td className="act">
                          {canCancel ? (
                            <button
                              type="button"
                              className="btn sm secondary"
                              disabled={busy === r.escrow}
                              onClick={(e) => {
                                e.stopPropagation()
                                setPending(r.escrow)
                              }}
                            >
                              {busy === r.escrow ? (
                                <span className="spin" />
                              ) : note === r.escrow ? (
                                "Demo only"
                              ) : r.stateName === "Expired" ? (
                                "Reclaim"
                              ) : (
                                "Cancel"
                              )}
                            </button>
                          ) : (
                            <Link
                              className="btn sm ghost"
                              to={`/deal/${r.escrow}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              View deal
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              ))
            )}
          </table>
        </div>
      )}
    </main>
  )
}
