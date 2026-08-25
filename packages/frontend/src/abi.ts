export const factoryAbi = [
  {
    type: "function",
    name: "create",
    stateMutability: "nonpayable",
    inputs: [
      { name: "baseToken", type: "address" },
      { name: "quoteToken", type: "address" },
      { name: "baseAmount", type: "uint256" },
      { name: "quoteAmount", type: "uint256" },
      { name: "allowedPayer", type: "address" },
      { name: "expiry", type: "uint256" },
    ],
    outputs: [{ name: "escrow", type: "address" }],
  },
  { type: "function", name: "usdg", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "feeTreasury", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "feeRate", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "feeDenominator", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "paused", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "owner", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "pause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "unpause", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "event",
    name: "EscrowCreated",
    inputs: [
      { name: "seller", type: "address", indexed: true },
      { name: "escrow", type: "address", indexed: true },
      { name: "baseToken", type: "address", indexed: false },
      { name: "quoteToken", type: "address", indexed: false },
      { name: "baseAmount", type: "uint256", indexed: false },
      { name: "quoteAmount", type: "uint256", indexed: false },
      { name: "expiry", type: "uint256", indexed: false },
      { name: "open", type: "bool", indexed: false },
      { name: "feeRate", type: "uint256", indexed: false },
      { name: "feeDenominator", type: "uint256", indexed: false },
      { name: "feeAmount", type: "uint256", indexed: false },
      { name: "allowedPayer", type: "address", indexed: false },
    ],
  },
] as const;

export const escrowAbi = [
  { type: "function", name: "state", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  { type: "function", name: "seller", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "baseToken", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "quoteToken", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "baseAmount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "quoteAmount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "allowedPayer", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "expiry", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "feeAmount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    type: "function",
    name: "settleEth",
    stateMutability: "payable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settleUsdg",
    stateMutability: "nonpayable",
    inputs: [{ name: "to", type: "address" }],
    outputs: [],
  },
  { type: "function", name: "cancel", stateMutability: "nonpayable", inputs: [], outputs: [] },
  {
    type: "event",
    name: "Settled",
    inputs: [
      { name: "payer", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "baseOut", type: "uint256", indexed: false },
      { name: "proceeds", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

export const treasuryAbi = [
  { type: "function", name: "payout", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "usdg", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  {
    type: "function",
    name: "release",
    stateMutability: "nonpayable",
    inputs: [{ name: "token", type: "address" }],
    outputs: [],
  },
  { type: "function", name: "releaseEth", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "releaseBoth", stateMutability: "nonpayable", inputs: [], outputs: [] },
] as const;

export const ESCROW_STATES = ["Created", "Open", "Settled", "Cancelled"] as const;
