import { fmtAmount } from "../lib/format"
import { formatTaxPct } from "../lib/tax"
import { Notice } from "./Notice"

export function TaxAccept({
  expected,
  received,
  decimals,
  symbol,
  quarterPct,
  phrase,
  typed,
  onTyped,
  recipientLabel,
}: {
  expected?: bigint
  received: bigint
  decimals?: number
  symbol: string
  quarterPct: number
  phrase: string
  typed: string
  onTyped: (value: string) => void
  recipientLabel: string
}) {
  const taxLabel = `${formatTaxPct(quarterPct)}%`
  return (
    <div className="stack-4">
      <Notice kind="warn" title="This token takes a tax.">
        The listed amount is {fmtAmount(expected, decimals)} {symbol}. {recipientLabel}{" "}
        {fmtAmount(received, decimals)} {symbol}. That is a {taxLabel} tax.
      </Notice>
      <div className="field">
        <label className="field-label" htmlFor="tax-accept">
          Type this phrase
        </label>
        <div className="input">
          <input
            id="tax-accept"
            autoComplete="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => onTyped(e.target.value)}
            aria-describedby="tax-accept-help"
          />
        </div>
        <p className="field-help" id="tax-accept-help">
          <span>{phrase}</span>
        </p>
      </div>
    </div>
  )
}
