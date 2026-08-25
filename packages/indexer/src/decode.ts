import { decodeAbiParameters, hexToNumber, pad, slice } from "viem"

import { CANCELLED, createdTypes, ESCROW_CREATED, SETTLED } from "./abi"
import { addr, type RawLog } from "./types"

export type CreatedEvent = {
  seller: string
  escrow: string
  baseToken: string
  quoteToken: string
  baseAmount: string
  quoteAmount: string
  expiry: number
  allowedPayer: string
  feeAmount: string
  feeDenominator: string
}

export type SettledEvent = {
  escrow: string
  payer: string
}

export type CancelledEvent = {
  escrow: string
}

function topicAddress(topic: string): string {
  return addr(slice(pad(topic as `0x${string}`, { size: 32 }), 12))
}

export function decodeCreated(log: RawLog): CreatedEvent | null {
  if (log.topics[0]?.toLowerCase() !== ESCROW_CREATED.toLowerCase()) return null
  if (log.topics.length < 3) return null
  try {
    const decoded = decodeAbiParameters(createdTypes, log.data as `0x${string}`)
    return {
      seller: topicAddress(log.topics[1]),
      escrow: topicAddress(log.topics[2]),
      baseToken: addr(decoded[0]),
      quoteToken: addr(decoded[1]),
      baseAmount: decoded[2].toString(),
      quoteAmount: decoded[3].toString(),
      expiry: Number(decoded[4]),
      allowedPayer: addr(decoded[9]),
      feeAmount: decoded[8].toString(),
      feeDenominator: decoded[7].toString(),
    }
  } catch {
    return null
  }
}

export function decodeSettled(log: RawLog): SettledEvent | null {
  if (log.topics[0]?.toLowerCase() !== SETTLED.toLowerCase()) return null
  if (log.topics.length < 2) return null
  return {
    escrow: addr(log.address),
    payer: topicAddress(log.topics[1]),
  }
}

export function decodeCancelled(log: RawLog): CancelledEvent | null {
  if (log.topics[0]?.toLowerCase() !== CANCELLED.toLowerCase()) return null
  return {
    escrow: addr(log.address),
  }
}

export function asBlock(value: bigint | number | string): bigint {
  if (typeof value === "bigint") return value
  if (typeof value === "number") return BigInt(value)
  return BigInt(value)
}

export function asIndex(value: bigint | number | string): number {
  if (typeof value === "number") return value
  if (typeof value === "bigint") return Number(value)
  if (value.startsWith("0x")) return hexToNumber(value as `0x${string}`)
  return Number(value)
}
