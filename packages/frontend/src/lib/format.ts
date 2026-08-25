import { formatUnits } from "viem"

export const short = (a?: string) =>
  a ? `${a.slice(0, 8)}…${a.slice(-4)}` : "—"

export const fmtAmount = (value?: bigint, decimals = 18) => {
  if (value === undefined) return "—"
  const s = formatUnits(value, decimals)
  const [int, frac = ""] = s.split(".")
  const intFmt = Number(int).toLocaleString("en-US")
  const fracPad = frac.padEnd(decimals, "0")
  return `${intFmt}.${fracPad}`
}

/**
 * A balance line, at one decimal. The figure truncates, so it never reads
 * higher than the holding. An exact value stays exact. Read
 * docs/brand/microcopy.md, and keep full precision anywhere money moves.
 */
export const fmtBalance = (value?: bigint, decimals = 18) => {
  if (value === undefined) return "—"
  const [int, frac = ""] = formatUnits(value, decimals).split(".")
  const kept = frac.slice(0, 1).padEnd(1, "0")
  const dropped = frac.slice(1).replace(/0+$/, "") !== ""
  const text = `${Number(int).toLocaleString("en-US")}.${kept}`
  return dropped ? `≈ ${text}` : text
}

export const fmtCountdown = (expiry: bigint) => {
  const secs = Number(expiry) - Math.floor(Date.now() / 1000)
  if (secs <= 0) return "expired"
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${secs % 60}s`
}

export const countdownUrgent = (expiry: bigint) => {
  const secs = Number(expiry) - Math.floor(Date.now() / 1000)
  return secs > 0 && secs < 300
}

export const fmtUtc = (unix: bigint | number) => {
  const date = new Date(Number(unix) * 1000)
  const day = date.getUTCDate()
  const month = date.toLocaleString("en-GB", { month: "short", timeZone: "UTC" })
  const year = date.getUTCFullYear()
  const hh = String(date.getUTCHours()).padStart(2, "0")
  const mm = String(date.getUTCMinutes()).padStart(2, "0")
  return `${day} ${month} ${year}, ${hh}:${mm} UTC`
}

export const isAddress = (s: string): s is `0x${string}` =>
  /^0x[0-9a-fA-F]{40}$/.test(s)

export const ZERO = "0x0000000000000000000000000000000000000000" as const
