/**
 * Tax display math for the official UI. Round to the nearest quarter percent.
 * Read packages/otc/docs/decisions/0035-official-ui-base-tax-disclosure.md.
 */

export function taxQuarterPct(expected: bigint, received: bigint): number {
  if (expected === 0n || received >= expected) return 0
  const missing = expected - received
  const quarters = (missing * 400n + expected / 2n) / expected
  return Number(quarters) / 4
}

export function formatTaxPct(quarterPct: number): string {
  const hundredths = Math.round(quarterPct * 100)
  if (hundredths % 100 === 0) return String(hundredths / 100)
  if (hundredths % 50 === 0) return (hundredths / 100).toFixed(1)
  return (hundredths / 100).toFixed(2)
}

export function taxAcceptPhrase(quarterPct: number): string {
  return `I accept the ${formatTaxPct(quarterPct)}% tax`
}
