import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { parseEventLogs, parseUnits } from "viem"
import {
  useAccount,
  useConnect,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useWriteContract,
} from "wagmi"

import { erc20Abi, factoryAbi } from "../abi"
import { ExpirySelect } from "../components/ExpirySelect"
import { Notice } from "../components/Notice"
import { SuccessModal } from "../components/SuccessModal"
import { TaxAccept } from "../components/TaxAccept"
import { VARIANT_LOGOS } from "../components/TokenLogo"
import { TokenStrip } from "../components/TokenStrip"
import { TokenSelect, type TokenPick } from "../components/TokenSelect"
import { explorerUrl, FACTORY_ADDRESS, FACTORY_DEPLOYED, robinhoodChain } from "../config"
import { IS_DEMO } from "../demo"
import { OFFICIAL_FEE_LABEL } from "../lib/fee"
import { fmtAmount, fmtBalance, isAddress, ZERO } from "../lib/format"
import { previewCreateReturn } from "../lib/preview"
import { fmtUsdCompact, useEthUsd, useUsdPrice } from "../lib/prices"
import { useTaxPreview } from "../lib/useTaxPreview"
import { PRESET_TOKENS, presetFor } from "../tokens"

type Quote = "ETH" | "USDG"

export function CreatePage() {
  const { address: account, isConnected, chainId } = useAccount()
  const { connect, connectors } = useConnect()
  const publicClient = usePublicClient()
  const { writeContractAsync } = useWriteContract()
  const navigate = useNavigate()

  const [params] = useSearchParams()
  const [pick, setPick] = useState<TokenPick>(() => {
    const t = params.get("token")
    return t && presetFor(t) ? presetFor(t)!.address : PRESET_TOKENS[0].address
  })

  useEffect(() => {
    const t = params.get("token")
    if (t && presetFor(t)) setPick(presetFor(t)!.address)
  }, [params])

  const [baseTokenInput, setBaseTokenInput] = useState("")
  const [baseAmountInput, setBaseAmountInput] = useState("")
  const [quote, setQuote] = useState<Quote>("ETH")
  const [quoteAmountInput, setQuoteAmountInput] = useState("")
  const [restricted, setRestricted] = useState(false)
  const [payerInput, setPayerInput] = useState("")
  const [expirySecs, setExpirySecs] = useState<number>(86400)
  const [busy, setBusy] = useState<"" | "approve" | "create">("")
  const [error, setError] = useState("")
  const [taxTyped, setTaxTyped] = useState("")
  const [created, setCreated] = useState<{ escrow: string; hash: string } | null>(null)

  const baseToken =
    pick === "custom" ? (isAddress(baseTokenInput) ? baseTokenInput : undefined) : pick

  const factory = useReadContracts({
    contracts: [
      { address: FACTORY_ADDRESS, abi: factoryAbi, functionName: "usdg" },
      { address: FACTORY_ADDRESS, abi: factoryAbi, functionName: "feeRate" },
      { address: FACTORY_ADDRESS, abi: factoryAbi, functionName: "feeDenominator" },
      { address: FACTORY_ADDRESS, abi: factoryAbi, functionName: "paused" },
    ],
    query: { enabled: FACTORY_DEPLOYED },
  })
  const [usdgAddr, feeRate, feeDenominator, paused] = [
    factory.data?.[0]?.result as `0x${string}` | undefined,
    factory.data?.[1]?.result as bigint | undefined,
    factory.data?.[2]?.result as bigint | undefined,
    factory.data?.[3]?.result as boolean | undefined,
  ]

  const meta = useReadContracts({
    contracts: [
      { address: baseToken, abi: erc20Abi, functionName: "symbol" },
      { address: baseToken, abi: erc20Abi, functionName: "decimals" },
      { address: baseToken, abi: erc20Abi, functionName: "balanceOf", args: [account ?? ZERO] },
    ],
    query: { enabled: !!baseToken },
  })
  const baseSymbol = meta.data?.[0]?.result as string | undefined
  const baseDecimals = meta.data?.[1]?.result as number | undefined
  const baseBalance = meta.data?.[2]?.result as bigint | undefined
  const baseTokenBad =
    pick === "custom" && !!baseToken && meta.isFetched && baseSymbol === undefined

  const usdgDecimals = useReadContract({
    address: usdgAddr,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!usdgAddr && quote === "USDG" },
  }).data as number | undefined

  const quoteDecimals = quote === "ETH" ? 18 : usdgDecimals

  const baseAmount = useMemo(() => {
    if (!baseAmountInput || baseDecimals === undefined) return undefined
    try {
      return parseUnits(baseAmountInput, baseDecimals)
    } catch {
      return undefined
    }
  }, [baseAmountInput, baseDecimals])

  const quoteAmount = useMemo(() => {
    if (!quoteAmountInput || quoteDecimals === undefined) return undefined
    try {
      return parseUnits(quoteAmountInput, quoteDecimals)
    } catch {
      return undefined
    }
  }, [quoteAmountInput, quoteDecimals])

  const feeAmount =
    quoteAmount !== undefined && feeRate !== undefined && feeDenominator
      ? (quoteAmount * feeRate) / feeDenominator
      : undefined

  const basePriceUsd = useUsdPrice(baseToken)
  const ethUsd = useEthUsd()

  const baseQty = Number(baseAmountInput) || 0
  const quoteQty = Number(quoteAmountInput) || 0
  const baseUsdValue = baseQty > 0 && basePriceUsd ? baseQty * basePriceUsd : undefined
  const quoteUsdValue =
    quoteQty > 0
      ? quote === "ETH"
        ? ethUsd
          ? quoteQty * ethUsd
          : undefined
        : quoteQty
      : undefined

  const impliedUnitPrice =
    baseQty > 0 && quoteUsdValue !== undefined ? quoteUsdValue / baseQty : undefined
  const marketDiffPct =
    impliedUnitPrice !== undefined && basePriceUsd
      ? ((impliedUnitPrice - basePriceUsd) / basePriceUsd) * 100
      : undefined

  const overBalance =
    baseAmount !== undefined && baseBalance !== undefined && baseAmount > baseBalance

  const allowance = useReadContract({
    address: baseToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account ?? ZERO, FACTORY_ADDRESS],
    query: { enabled: !!baseToken && !!account && FACTORY_DEPLOYED },
  })
  const needsApproval =
    baseAmount !== undefined &&
    allowance.data !== undefined &&
    (allowance.data as bigint) < baseAmount

  const payer = restricted && isAddress(payerInput) ? payerInput : ZERO

  const payerError = restricted && payerInput.length > 0 && !isAddress(payerInput)

  const validationError = useMemo(() => {
    if (!FACTORY_DEPLOYED)
      return IS_DEMO ? "" : "The factory address is not set in this build. No deal can be created."
    if (paused) return ""
    if (baseTokenBad)
      return "That address does not answer as an ERC-20 token. Check it on the explorer."
    if (baseToken && usdgAddr && baseToken.toLowerCase() === usdgAddr.toLowerCase())
      return "USDG is a payment asset. Choose another token to deliver."
    if (baseAmount !== undefined && baseBalance !== undefined && baseAmount > baseBalance)
      return `You hold ${fmtAmount(baseBalance, baseDecimals)} ${baseSymbol ?? ""}. Lower the amount or add funds.`
    return ""
  }, [paused, baseTokenBad, baseToken, usdgAddr, baseAmount, baseBalance, baseDecimals, baseSymbol])

  const ready =
    FACTORY_DEPLOYED &&
    isConnected &&
    chainId === robinhoodChain.id &&
    !paused &&
    !!baseToken &&
    baseAmount !== undefined &&
    baseAmount > 0n &&
    quoteAmount !== undefined &&
    quoteAmount > 0n &&
    !validationError &&
    (!restricted || isAddress(payerInput))

  const taxPreview = useTaxPreview({
    expected: baseAmount,
    enabled: ready && !needsApproval && !!account && !!publicClient && !!usdgAddr,
    depsKey: `${baseToken}-${baseAmount}-${quoteAmount}-${quote}-${payer}-${expirySecs}-${account}`,
    run: () =>
      previewCreateReturn(publicClient!, account!, {
        factory: FACTORY_ADDRESS,
        baseToken: baseToken as `0x${string}`,
        quoteToken: quote === "ETH" ? ZERO : (usdgAddr as `0x${string}`),
        baseAmount: baseAmount!,
        quoteAmount: quoteAmount!,
        allowedPayer: payer,
        expiry: BigInt(Math.floor(Date.now() / 1000) + expirySecs),
      }),
  })

  const taxPhrase = taxPreview.status === "taxed" ? taxPreview.phrase : ""
  useEffect(() => {
    setTaxTyped("")
  }, [taxPhrase])

  const taxAccepted = taxPreview.status !== "taxed" || taxTyped === taxPreview.phrase

  async function onSubmit() {
    if (
      !ready ||
      !baseToken ||
      !publicClient ||
      baseAmount === undefined ||
      quoteAmount === undefined ||
      !taxAccepted
    )
      return
    setError("")
    try {
      if (needsApproval) {
        setBusy("approve")
        const hash = await writeContractAsync({
          address: baseToken,
          abi: erc20Abi,
          functionName: "approve",
          args: [FACTORY_ADDRESS, baseAmount],
        })
        await publicClient.waitForTransactionReceipt({ hash })
        await allowance.refetch()
        setBusy("")
        return
      }
      setBusy("create")
      const expiry = BigInt(Math.floor(Date.now() / 1000) + expirySecs)
      const quoteToken = quote === "ETH" ? ZERO : (usdgAddr as `0x${string}`)
      const hash = await writeContractAsync({
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "create",
        args: [baseToken, quoteToken, baseAmount, quoteAmount, payer, expiry],
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const [createdLog] = parseEventLogs({
        abi: factoryAbi,
        eventName: "EscrowCreated",
        logs: receipt.logs,
      })
      if (createdLog) setCreated({ escrow: createdLog.args.escrow, hash })
    } catch (e) {
      setError(shortenError(e))
    } finally {
      setBusy("")
    }
  }

  const feePct =
    feeRate !== undefined && feeDenominator
      ? `${((Number(feeRate) / Number(feeDenominator)) * 100).toFixed(2)}%`
      : undefined

  const cta = !isConnected
    ? "Connect a wallet"
    : chainId !== robinhoodChain.id
      ? `Switch to ${robinhoodChain.name}`
      : busy === "approve"
        ? "Approving…"
        : busy === "create"
          ? "Creating deal…"
          : needsApproval
            ? `Approve ${baseSymbol ?? "the token"}`
            : "Create deal"

  function onCta() {
    if (!isConnected) {
      connect({ connector: connectors[0] })
      return
    }
    onSubmit()
  }

  const ctaDisabled =
    isConnected &&
    (!ready ||
      busy !== "" ||
      (!needsApproval && (taxPreview.status === "loading" || taxPreview.status === "revert" || !taxAccepted)))
  const proceeds =
    quoteAmount !== undefined && feeAmount !== undefined ? quoteAmount - feeAmount : undefined

  return (
    <main className="page shell" id="main">
      <div className="page-column">
        <div className="page-head">
          <h1 className="page-title">Create a deal</h1>
          <p className="page-sub">
            Lock a holding in escrow and set your price. One transaction moves both sides, or
            neither.
          </p>
        </div>

        <section className="panel" aria-labelledby="deal-terms">
          <div className="panel-head">
            <h2 id="deal-terms" className="title-panel">
              Deal terms
            </h2>
            <span className="label">Protocol fee {feePct ?? OFFICIAL_FEE_LABEL}</span>
          </div>

          <div className="panel-body">
            <div className="block">
              <div className="block-head">
                <span className="block-label">You deliver</span>
                {baseBalance !== undefined && (
                  <span className="field-help">
                    {/* The title carries the exact holding. Max fills it in full. */}
                    <span title={`${fmtAmount(baseBalance, baseDecimals)} ${baseSymbol ?? ""}`}>
                      Balance: {fmtBalance(baseBalance, baseDecimals)} {baseSymbol ?? ""}
                    </span>
                    <button
                      type="button"
                      className="link-action"
                      onClick={() => {
                        if (baseBalance === undefined || baseDecimals === undefined) return
                        setBaseAmountInput(fmtAmount(baseBalance, baseDecimals).replace(/,/g, ""))
                      }}
                    >
                      Max
                    </button>
                  </span>
                )}
              </div>

              <div className="field-row">
                <div className="field">
                  <span className="field-label">Asset</span>
                  <TokenSelect
                    pick={pick}
                    customAddress={pick === "custom" ? baseToken : undefined}
                    customSymbol={pick === "custom" ? baseSymbol : undefined}
                    network={robinhoodChain.name}
                    onPick={setPick}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="base-amount">
                    Amount
                  </label>
                  <div className={`input-amount${overBalance ? " err" : ""}`}>
                    <input
                      id="base-amount"
                      placeholder="0"
                      inputMode="decimal"
                      autoComplete="off"
                      value={baseAmountInput}
                      onChange={(e) => setBaseAmountInput(e.target.value)}
                    />
                    {baseSymbol && <span className="unit">{baseSymbol}</span>}
                  </div>
                  {baseUsdValue !== undefined && (
                    <p className="field-help">
                      <span />
                      <span>≈ {fmtUsdCompact(baseUsdValue)}</span>
                    </p>
                  )}
                </div>
              </div>

              {pick === "custom" && (
                <div className="field">
                  <label className="field-label" htmlFor="base-token">
                    Token contract
                  </label>
                  <div className="input address">
                    <input
                      id="base-token"
                      placeholder="0x…"
                      autoComplete="off"
                      spellCheck={false}
                      value={baseTokenInput}
                      onChange={(e) => setBaseTokenInput(e.target.value.trim())}
                    />
                  </div>
                  <p className="field-help">
                    <span>Check the contract on the explorer before you list it.</span>
                  </p>
                </div>
              )}
            </div>

            <div className="panel-rule ornament lozenge-rule" aria-hidden="true">
              <span className="lozenge" />
            </div>

            <div className="block">
              <div className="block-head">
                <span className="block-label">You receive</span>
              </div>

              <div className="field-row">
                <div className="field">
                  <span className="field-label" id="quote-asset-label">
                    Payment asset
                  </span>
                  <div
                    className="segmented lg"
                    role="radiogroup"
                    aria-labelledby="quote-asset-label"
                    data-active={quote === "ETH" ? 0 : 1}
                    style={{ ["--seg-active" as string]: quote === "ETH" ? 0 : 1 }}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={quote === "ETH"}
                      onClick={() => setQuote("ETH")}
                    >
                      <img className="seg-logo" src={VARIANT_LOGOS.eth} alt="" />
                      ETH
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={quote === "USDG"}
                      onClick={() => setQuote("USDG")}
                    >
                      <img className="seg-logo" src={VARIANT_LOGOS.usdg} alt="" />
                      USDG
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="quote-amount">
                    Amount
                  </label>
                  <div className="input-amount">
                    <input
                      id="quote-amount"
                      placeholder="0"
                      inputMode="decimal"
                      autoComplete="off"
                      value={quoteAmountInput}
                      onChange={(e) => setQuoteAmountInput(e.target.value)}
                    />
                    <span className="unit">{quote}</span>
                  </div>
                  {quoteUsdValue !== undefined && (
                    <p className="field-help">
                      <span />
                      <span>≈ {fmtUsdCompact(quoteUsdValue)}</span>
                    </p>
                  )}
                </div>
              </div>

              {marketDiffPct !== undefined && basePriceUsd !== undefined && (
                <div className="receipt">
                  <div className="receipt-row">
                    <span>Market price</span>
                    <span className="num">
                      {fmtUsdCompact(basePriceUsd)} / {baseSymbol ?? "token"}
                    </span>
                  </div>
                  <div className="receipt-row">
                    <span>Your price</span>
                    <span className="num">
                      {fmtUsdCompact(impliedUnitPrice)} / {baseSymbol ?? "token"}
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
            </div>

            <div className="panel-rule" aria-hidden="true" />

            <div className="block">
              {/* The same column widths as the rows above, so every field lines up. */}
              <div className="field-row">
                <div className="field">
                  <span className="field-label" id="access-label">
                    Who can pay
                  </span>
                  <div
                    className="segmented"
                    role="radiogroup"
                    aria-labelledby="access-label"
                    data-active={restricted ? 1 : 0}
                    style={{ ["--seg-active" as string]: restricted ? 1 : 0 }}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={!restricted}
                      onClick={() => setRestricted(false)}
                    >
                      Anyone
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={restricted}
                      onClick={() => setRestricted(true)}
                    >
                      One address
                    </button>
                  </div>
                </div>
                <div className="field">
                  <span className="field-label">Expires after</span>
                  <ExpirySelect value={expirySecs} onChange={setExpirySecs} />
                </div>
              </div>

              {restricted && (
                <div className="field">
                  <label className="field-label" htmlFor="payer">
                    Payer address
                  </label>
                  <div className={`input address${payerError ? " err" : ""}`}>
                    <input
                      id="payer"
                      placeholder="0x…"
                      autoComplete="off"
                      spellCheck={false}
                      value={payerInput}
                      onChange={(e) => setPayerInput(e.target.value.trim())}
                    />
                  </div>
                  <p className={`field-help${payerError ? " err" : ""}`}>
                    <span>
                      {payerError
                        ? "That is not a valid address. It needs 40 hexadecimal characters after 0x."
                        : "Only this address can settle the deal."}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="panel-foot">
            {feeAmount !== undefined && feePct && quoteAmount !== undefined && (
              <div className="receipt">
                <div className="receipt-row">
                  <span>You deliver</span>
                  <span className="num">
                    {fmtAmount(baseAmount, baseDecimals)} {baseSymbol ?? ""}
                  </span>
                </div>
                <div className="receipt-row">
                  <span>Buyer pays</span>
                  <span className="num">
                    {fmtAmount(quoteAmount, quoteDecimals)} {quote}
                  </span>
                </div>
                <div className="receipt-row">
                  <span>Protocol fee ({feePct})</span>
                  <span className="num">
                    {fmtAmount(feeAmount, quoteDecimals)} {quote}
                  </span>
                </div>
                <div className="receipt-row total">
                  <span>You receive</span>
                  <span className="num">
                    {fmtAmount(proceeds, quoteDecimals)} {quote}
                  </span>
                </div>
                {taxPreview.status === "taxed" && (
                  <div className="receipt-row">
                    <span>Escrow send would credit</span>
                    <span className="num">
                      {fmtAmount(taxPreview.received, baseDecimals)} {baseSymbol ?? ""}
                    </span>
                  </div>
                )}
              </div>
            )}

            {paused && (
              <Notice kind="info" title="The factory is paused.">
                No new deal can be created. Open deals are not affected.
              </Notice>
            )}

            {IS_DEMO && !FACTORY_DEPLOYED && (
              <Notice kind="warn" title="Demo data.">
                The factory is not deployed in this build, so nothing can move.
              </Notice>
            )}

            {(validationError || error) && (
              <Notice kind="err">{validationError || error}</Notice>
            )}

            {taxPreview.status === "revert" && (
              <Notice kind="err" title="This create call would fail.">
                The token taxes the deposit into escrow, or it rejects the transfer.
              </Notice>
            )}

            {taxPreview.status === "taxed" && (
              <TaxAccept
                expected={baseAmount}
                received={taxPreview.received}
                decimals={baseDecimals}
                symbol={baseSymbol ?? "token"}
                quarterPct={taxPreview.quarterPct}
                phrase={taxPreview.phrase}
                typed={taxTyped}
                onTyped={setTaxTyped}
                recipientLabel="A send from escrow would credit"
              />
            )}

            <button className="btn primary lg block" disabled={ctaDisabled} onClick={onCta}>
              {busy !== "" && <span className="spin" />}
              {cta}
            </button>
          </div>
        </section>
      </div>

      <TokenStrip />

      <SuccessModal
        open={!!created}
        title="Deal created"
        subtitle="Your tokens are in escrow. Share the link with your buyer, or wait for the market page."
        txHash={created?.hash}
        dealUrl={created ? `${window.location.origin}/deal/${created.escrow}` : undefined}
        actionLabel="View the deal"
        onAction={() => navigate(`/deal/${created!.escrow}`)}
        closeLabel="Create another"
        onClose={() => {
          setCreated(null)
          setBaseAmountInput("")
          setQuoteAmountInput("")
        }}
      />

    </main>
  )
}

function shortenError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.includes("User rejected"))
    return "You rejected the transaction in your wallet. Nothing moved."
  return msg.split("\n")[0].slice(0, 160)
}
