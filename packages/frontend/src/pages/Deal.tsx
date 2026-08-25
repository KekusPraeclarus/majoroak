import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi"

import { erc20Abi, escrowAbi, ESCROW_STATES } from "../abi"
import { ArrowUpRight, Copy } from "../components/Icon"
import { Notice } from "../components/Notice"
import { TaxAccept } from "../components/TaxAccept"
import { PriceChart } from "../components/PriceChart"
import { StatusChip } from "../components/StatusChip"
import { SuccessModal } from "../components/SuccessModal"
import { TokenLogo } from "../components/TokenLogo"
import { VerifiedBadge } from "../components/VerifiedBadge"
import { UnverifiedBadge } from "../components/UnverifiedBadge"
import { demoFor, DEMO_USDG } from "../demo"
import { previewCancel, previewSettleEth, previewSettleUsdg } from "../lib/preview"
import { fmtUsdCompact, useEthUsd, useUsdPrice } from "../lib/prices"
import { useTaxPreview } from "../lib/useTaxPreview"
import { presetFor } from "../tokens"
import { explorerUrl, robinhoodChain } from "../config"
import {
  countdownUrgent,
  fmtAmount,
  fmtCountdown,
  fmtUtc,
  isAddress,
  short,
  ZERO,
} from "../lib/format"

export function DealPage() {
  const { address: raw } = useParams()
  const escrow = raw && isAddress(raw) ? raw : undefined
  const { address: account, isConnected, chainId } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()

  const [busy, setBusy] = useState<"" | "approve" | "settle" | "cancel">("")
  const [error, setError] = useState("")
  const [taxTyped, setTaxTyped] = useState("")
  const [copied, setCopied] = useState(false)
  const [success, setSuccess] = useState<{ kind: "settle" | "cancel"; hash: string } | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const deal = useReadContracts({
    contracts: [
      { address: escrow, abi: escrowAbi, functionName: "state" },
      { address: escrow, abi: escrowAbi, functionName: "seller" },
      { address: escrow, abi: escrowAbi, functionName: "baseToken" },
      { address: escrow, abi: escrowAbi, functionName: "quoteToken" },
      { address: escrow, abi: escrowAbi, functionName: "baseAmount" },
      { address: escrow, abi: escrowAbi, functionName: "quoteAmount" },
      { address: escrow, abi: escrowAbi, functionName: "allowedPayer" },
      { address: escrow, abi: escrowAbi, functionName: "expiry" },
      { address: escrow, abi: escrowAbi, functionName: "feeAmount" },
    ],
    query: { enabled: !!escrow, refetchInterval: 12_000 },
  })

  const demo = escrow ? demoFor(escrow) : undefined

  const state = demo ? demo.state : (deal.data?.[0]?.result as number | undefined)
  const seller = demo ? demo.seller : (deal.data?.[1]?.result as `0x${string}` | undefined)
  const baseToken = demo ? demo.baseToken : (deal.data?.[2]?.result as `0x${string}` | undefined)
  const quoteToken = demo
    ? demo.quoteKind === "ETH"
      ? ZERO
      : DEMO_USDG
    : (deal.data?.[3]?.result as `0x${string}` | undefined)
  const baseAmount = demo ? demo.baseAmount : (deal.data?.[4]?.result as bigint | undefined)
  const quoteAmount = demo ? demo.quoteAmount : (deal.data?.[5]?.result as bigint | undefined)
  const allowedPayer = demo
    ? demo.allowedPayer
    : (deal.data?.[6]?.result as `0x${string}` | undefined)
  const expiry = demo ? demo.expiry : (deal.data?.[7]?.result as bigint | undefined)
  const feeAmount = demo
    ? demo.quoteAmount / 100n
    : (deal.data?.[8]?.result as bigint | undefined)

  const isEthQuote = quoteToken === ZERO

  const baseMeta = useReadContracts({
    contracts: [
      { address: baseToken, abi: erc20Abi, functionName: "symbol" },
      { address: baseToken, abi: erc20Abi, functionName: "decimals" },
    ],
    query: { enabled: !!baseToken },
  })
  const baseSymbol = (baseMeta.data?.[0]?.result as string | undefined) ?? "Token"
  const baseDecimals = baseMeta.data?.[1]?.result as number | undefined

  const quoteMeta = useReadContracts({
    contracts: [
      { address: quoteToken, abi: erc20Abi, functionName: "symbol" },
      { address: quoteToken, abi: erc20Abi, functionName: "decimals" },
    ],
    query: { enabled: !!quoteToken && quoteToken !== ZERO },
  })
  const quoteSymbol = isEthQuote
    ? "ETH"
    : ((quoteMeta.data?.[0]?.result as string | undefined) ?? "USDG")
  const quoteDecimals = demo
    ? demo.quoteDecimals
    : isEthQuote
      ? 18
      : (quoteMeta.data?.[1]?.result as number | undefined)

  const allowance = useReadContract({
    address: quoteToken !== ZERO ? quoteToken : undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account ?? ZERO, escrow ?? ZERO],
    query: { enabled: !!escrow && !!account && !!quoteToken && quoteToken !== ZERO },
  })

  const ethUsd = useEthUsd()
  const otcUnitPrice = useMemo(() => {
    if (baseAmount === undefined || quoteAmount === undefined || baseDecimals === undefined)
      return undefined
    const baseUnits = Number(baseAmount) / 10 ** baseDecimals
    if (baseUnits <= 0) return undefined
    const quoteUnits = Number(quoteAmount) / 10 ** (quoteDecimals ?? 18)
    const quoteUsd = isEthQuote ? (ethUsd ? quoteUnits * ethUsd : undefined) : quoteUnits
    return quoteUsd !== undefined ? quoteUsd / baseUnits : undefined
  }, [baseAmount, quoteAmount, baseDecimals, quoteDecimals, isEthQuote, ethUsd])

  const basePriceUsd = useUsdPrice(baseToken)
  const marketDiffPct =
    otcUnitPrice !== undefined && basePriceUsd
      ? ((otcUnitPrice - basePriceUsd) / basePriceUsd) * 100
      : undefined

  const expired = expiry !== undefined && Number(expiry) <= Math.floor(Date.now() / 1000)
  const isSeller = demo
    ? demo.role === "seller"
    : !!account && !!seller && account.toLowerCase() === seller.toLowerCase()
  const restricted = !!allowedPayer && allowedPayer !== ZERO
  const isAllowedPayer =
    !restricted || (!!account && account.toLowerCase() === allowedPayer!.toLowerCase())

  const needsApproval =
    !isEthQuote &&
    quoteAmount !== undefined &&
    allowance.data !== undefined &&
    (allowance.data as bigint) < quoteAmount

  const taxPreview = useTaxPreview({
    expected: baseAmount,
    enabled:
      !demo &&
      !!escrow &&
      !!account &&
      !!publicClient &&
      !!baseToken &&
      state === 1 &&
      isConnected &&
      chainId === robinhoodChain.id &&
      (isSeller || (!expired && !needsApproval)),
    depsKey: `${escrow}-${account}-${isSeller}-${isEthQuote}-${baseToken}-${baseAmount}-${quoteAmount}-${expired}`,
    run: () => {
      if (isSeller) {
        return previewCancel(publicClient!, account!, {
          escrow: escrow!,
          recipient: account!,
          baseToken: baseToken!,
        })
      }
      if (isEthQuote) {
        return previewSettleEth(publicClient!, account!, {
          escrow: escrow!,
          to: account!,
          baseToken: baseToken!,
          quoteAmount: quoteAmount!,
        })
      }
      return previewSettleUsdg(publicClient!, account!, {
        escrow: escrow!,
        to: account!,
        baseToken: baseToken!,
      })
    },
  })

  const taxPhrase = taxPreview.status === "taxed" ? taxPreview.phrase : ""
  useEffect(() => {
    setTaxTyped("")
  }, [taxPhrase])

  const taxAccepted = taxPreview.status !== "taxed" || taxTyped === taxPreview.phrase

  const statusKey = useMemo(() => {
    if (state === undefined) return ""
    if (state === 1 && expired) return "expired"
    return ESCROW_STATES[state].toLowerCase()
  }, [state, expired])

  const statusLabel =
    state === undefined ? "Loading" : state === 1 && expired ? "Expired" : ESCROW_STATES[state]

  async function run(kind: "approve" | "settle" | "cancel") {
    if (!escrow || !publicClient) return
    if (demo) {
      setError("This is a demo deal. No action can run in preview mode.")
      return
    }
    if ((kind === "settle" || kind === "cancel") && !taxAccepted) return
    setError("")
    setBusy(kind)
    try {
      let hash: `0x${string}`
      if (kind === "approve") {
        hash = await writeContractAsync({
          address: quoteToken!,
          abi: erc20Abi,
          functionName: "approve",
          args: [escrow, quoteAmount!],
        })
      } else if (kind === "settle") {
        hash = isEthQuote
          ? await writeContractAsync({
              address: escrow,
              abi: escrowAbi,
              functionName: "settleEth",
              args: [account!],
              value: quoteAmount!,
            })
          : await writeContractAsync({
              address: escrow,
              abi: escrowAbi,
              functionName: "settleUsdg",
              args: [account!],
            })
      } else {
        hash = await writeContractAsync({
          address: escrow,
          abi: escrowAbi,
          functionName: "cancel",
        })
      }
      await publicClient.waitForTransactionReceipt({ hash })
      await Promise.all([deal.refetch(), allowance.refetch()])
      if (kind === "settle" || kind === "cancel") setSuccess({ kind, hash })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(
        msg.includes("User rejected")
          ? "You rejected the transaction in your wallet. Nothing moved."
          : msg.split("\n")[0].slice(0, 160),
      )
    } finally {
      setBusy("")
    }
  }

  if (!escrow) {
    return (
      <main className="page shell" id="main">
        <div className="page-column">
          <div className="empty">
            <span className="lozenge" aria-hidden="true" />
            <p>That link does not hold a valid address.</p>
          </div>
        </div>
      </main>
    )
  }

  const dealUrl = `${window.location.origin}/deal/${escrow}`
  const canAct = isConnected && chainId === robinhoodChain.id
  const proceeds =
    quoteAmount !== undefined && feeAmount !== undefined ? quoteAmount - feeAmount : undefined
  const loading = !demo && state === undefined

  const subtitle =
    state === 1 && !expired && expiry !== undefined
      ? `Open for another ${fmtCountdown(expiry)}.`
      : state === 2
        ? "This deal settled. Both transfers ran in one transaction."
        : state === 3
          ? "The seller cancelled this deal."
          : expired
            ? "This deal expired. The seller can reclaim the base asset."
            : ""

  return (
    <main className="page shell" id="main">
      <div className="page-column">
        <SuccessModal
          open={!!success}
          title={success?.kind === "settle" ? "Deal settled" : "Tokens reclaimed"}
          subtitle={
            success?.kind === "settle"
              ? "The seller is paid. Check your wallet for the token credit."
              : "The deal is closed. Check your wallet for the returned tokens."
          }
          txHash={success?.hash}
          onClose={() => setSuccess(null)}
        />

        <div className="page-head tight">
          <div className="title-row">
            <h1 className="page-title">
              {baseSymbol} · {quoteSymbol}
              {demo && <span className="demo-tag">demo data</span>}
            </h1>
            {statusLabel !== "Loading" && <StatusChip label={statusKey || statusLabel} />}
          </div>
          {subtitle && (
            <p
              className={`page-sub${state === 1 && !expired && expiry && countdownUrgent(expiry) ? " countdown-warn" : ""}`}
            >
              {subtitle}
            </p>
          )}
        </div>

        <section className="panel" aria-labelledby="deal-terms">
          <div className="panel-head">
            <h2 id="deal-terms" className="title-panel">
              Deal terms
            </h2>
            <a
              className="btn-link"
              href={explorerUrl(`/address/${escrow}`)}
              target="_blank"
              rel="noreferrer"
            >
              Escrow contract
              <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="panel-body">
            {loading ? (
              <div className="stack-4" aria-busy="true">
                <span className="skeleton" style={{ height: 12, width: 96 }} />
                <span className="skeleton" style={{ height: 32 }} />
                <span className="skeleton" style={{ height: 12, width: 96 }} />
                <span className="skeleton" style={{ height: 32 }} />
              </div>
            ) : (
              <>
                <div className="block">
                  <div className="block-head">
                    <span className="block-label">{isSeller ? "You deliver" : "You receive"}</span>
                  </div>
                  <div className="figure">
                    <span className="token-identity">
                      <TokenLogo address={baseToken} symbol={baseSymbol} size={28} />
                      <span>
                        <span className="sym">
                          {baseSymbol}
                          {presetFor(baseToken) ? (
                            <VerifiedBadge size={14} />
                          ) : baseToken ? (
                            <UnverifiedBadge size={14} />
                          ) : null}
                        </span>
                        <a
                          className="net mono"
                          href={explorerUrl(`/address/${baseToken}`)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {short(baseToken)}
                        </a>
                      </span>
                    </span>
                    <span className="figure-value">
                      {fmtAmount(baseAmount, baseDecimals)}
                      <span className="unit">{baseSymbol}</span>
                    </span>
                  </div>
                </div>

                <div className="panel-rule ornament lozenge-rule" aria-hidden="true">
                  <span className="lozenge" />
                </div>

                <div className="block">
                  <div className="block-head">
                    <span className="block-label">{isSeller ? "You receive" : "You pay"}</span>
                  </div>
                  <div className="figure">
                    <span className="token-identity">
                      <TokenLogo
                        address={isEthQuote ? undefined : quoteToken}
                        symbol={quoteSymbol}
                        variant={isEthQuote ? "eth" : "usdg"}
                        size={28}
                      />
                      <span>
                        <span className="sym">{quoteSymbol}</span>
                        <span className="net">{robinhoodChain.name}</span>
                      </span>
                    </span>
                    <span className="figure-value">
                      {fmtAmount(quoteAmount, quoteDecimals)}
                      <span className="unit">{quoteSymbol}</span>
                    </span>
                  </div>

                  {feeAmount !== undefined && quoteAmount !== undefined && (
                    <div className="receipt">
                      <div className="receipt-row">
                        <span>Buyer pays</span>
                        <span className="num">
                          {fmtAmount(quoteAmount, quoteDecimals)} {quoteSymbol}
                        </span>
                      </div>
                      <div className="receipt-row">
                        <span>Protocol fee</span>
                        <span className="num">
                          {fmtAmount(feeAmount, quoteDecimals)} {quoteSymbol}
                        </span>
                      </div>
                      <div className="receipt-row total">
                        <span>{isSeller ? "You receive" : "Seller receives"}</span>
                        <span className="num">
                          {fmtAmount(proceeds, quoteDecimals)} {quoteSymbol}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="panel-rule" aria-hidden="true" />

                <div className="kv-list">
                  <div className="kv">
                    <span className="k">Seller</span>
                    <span className="v">
                      <a
                        className="mono"
                        href={explorerUrl(`/address/${seller}`)}
                        target="_blank"
                        rel="noreferrer"
                        title={seller}
                      >
                        {short(seller)}
                        {isSeller ? " (you)" : ""}
                      </a>
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">Who can pay</span>
                    <span className="v">
                      {restricted ? (
                        <span className="mono" title={allowedPayer}>
                          {short(allowedPayer)}
                          {isAllowedPayer && account ? " (you)" : ""}
                        </span>
                      ) : (
                        "Anyone"
                      )}
                    </span>
                  </div>
                  <div className="kv">
                    <span className="k">Base token contract</span>
                    <span className="v">
                      <a
                        className="mono"
                        href={explorerUrl(`/address/${baseToken}`)}
                        target="_blank"
                        rel="noreferrer"
                        title={baseToken}
                      >
                        {short(baseToken)}
                      </a>
                    </span>
                  </div>
                  {expiry !== undefined && (
                    <div className="kv">
                      <span className="k">Expires</span>
                      <span className={`v${countdownUrgent(expiry) ? " countdown-warn" : ""}`}>
                        {fmtUtc(expiry)}
                        {state === 1 && !expired ? ` · ${fmtCountdown(expiry)}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="panel-rule" aria-hidden="true" />

                <PriceChart
                  tokenAddress={baseToken}
                  symbol={baseSymbol}
                  otcUnitPrice={otcUnitPrice}
                />

                {marketDiffPct !== undefined && basePriceUsd !== undefined && (
                  <div className="receipt">
                    <div className="receipt-row">
                      <span>Market price</span>
                      <span className="num">
                        {fmtUsdCompact(basePriceUsd)} / {baseSymbol}
                      </span>
                    </div>
                    <div className="receipt-row">
                      <span>This deal</span>
                      <span className="num">
                        {fmtUsdCompact(otcUnitPrice)} / {baseSymbol}
                      </span>
                    </div>
                    <div className="receipt-row total">
                      <span>Against the market</span>
                      <span className="num">
                        {Math.abs(marketDiffPct).toFixed(1)}%{" "}
                        {marketDiffPct <= 0 ? "below" : "above"}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="panel-foot">
            {state === 1 && !expired && !isSeller && !isAllowedPayer && (
              <Notice kind="warn" title="This deal is reserved for one address.">
                You cannot pay it from this wallet.
              </Notice>
            )}

            {error && <Notice kind="err">{error}</Notice>}

            {taxPreview.status === "revert" && (
              <Notice kind="err" title="This call would fail.">
                The token rejects the transfer, or the deal cannot complete.
              </Notice>
            )}

            {taxPreview.status === "taxed" && (
              <TaxAccept
                expected={baseAmount}
                received={taxPreview.received}
                decimals={baseDecimals}
                symbol={baseSymbol}
                quarterPct={taxPreview.quarterPct}
                phrase={taxPreview.phrase}
                typed={taxTyped}
                onTyped={setTaxTyped}
                recipientLabel="You would receive"
              />
            )}

            {state === 1 &&
              !expired &&
              (isSeller ? (
                <button
                  className="btn danger lg block"
                  disabled={
                    (!demo && !canAct) ||
                    busy !== "" ||
                    taxPreview.status === "loading" ||
                    taxPreview.status === "revert" ||
                    !taxAccepted
                  }
                  onClick={() => run("cancel")}
                >
                  {busy === "cancel" && <span className="spin" />}
                  Cancel deal
                </button>
              ) : (
                <button
                  className="btn primary lg block"
                  disabled={
                    (!demo && (!canAct || !isAllowedPayer)) ||
                    busy !== "" ||
                    (!needsApproval &&
                      (taxPreview.status === "loading" ||
                        taxPreview.status === "revert" ||
                        !taxAccepted))
                  }
                  onClick={() => run(needsApproval ? "approve" : "settle")}
                >
                  {busy !== "" && <span className="spin" />}
                  {!isConnected
                    ? "Connect a wallet"
                    : chainId !== robinhoodChain.id
                      ? `Switch to ${robinhoodChain.name}`
                      : needsApproval
                        ? `Approve ${quoteSymbol}`
                        : `Pay ${fmtAmount(quoteAmount, quoteDecimals)} ${quoteSymbol}`}
                </button>
              ))}

            {isSeller && state === 1 && expired && (
              <button
                className="btn primary lg block"
                disabled={
                  (!demo && !canAct) ||
                  busy !== "" ||
                  taxPreview.status === "loading" ||
                  taxPreview.status === "revert" ||
                  !taxAccepted
                }
                onClick={() => run("cancel")}
              >
                {busy === "cancel" && <span className="spin" />}
                Reclaim tokens
              </button>
            )}

            <div className="copy-row">
              <span className="url mono">{dealUrl}</span>
              <button
                type="button"
                className="btn sm secondary"
                onClick={() => {
                  navigator.clipboard.writeText(dealUrl)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1500)
                }}
              >
                <Copy size={16} />
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        </section>

        <p className="footnote warn">
          Check the token contract on the explorer before you pay. Anyone can create a token with
          any name or symbol.
        </p>
      </div>
    </main>
  )
}
