import { toEventHash, toFunctionSelector } from "viem"

export const ESCROW_CREATED = toEventHash(
  "event EscrowCreated(address indexed seller, address indexed escrow, address baseToken, address quoteToken, uint256 baseAmount, uint256 quoteAmount, uint256 expiry, bool open, uint256 feeRate, uint256 feeDenominator, uint256 feeAmount, address allowedPayer)",
)

export const SETTLED = toEventHash(
  "event Settled(address indexed payer, address indexed to, uint256 baseOut, uint256 proceeds, uint256 fee)",
)

export const CANCELLED = toEventHash(
  "event Cancelled(address indexed seller, uint256 baseOut)",
)

export const STATE_SELECTOR = toFunctionSelector("function state()")
export const FEE_DENOMINATOR_SELECTOR = toFunctionSelector("function feeDenominator()")

export const createdTypes = [
  { type: "address" },
  { type: "address" },
  { type: "uint256" },
  { type: "uint256" },
  { type: "uint256" },
  { type: "bool" },
  { type: "uint256" },
  { type: "uint256" },
  { type: "uint256" },
  { type: "address" },
] as const
