import {
  decodeFunctionResult,
  encodeFunctionData,
  type Address,
  type PublicClient,
} from "viem"

import { PREVIEW_BYTECODE } from "./preview-bytecode"

const previewAbi = [
  {
    type: "function",
    name: "previewCreateReturn",
    stateMutability: "nonpayable",
    inputs: [
      { name: "factory", type: "address" },
      { name: "baseToken", type: "address" },
      { name: "quoteToken", type: "address" },
      { name: "baseAmount", type: "uint256" },
      { name: "quoteAmount", type: "uint256" },
      { name: "allowedPayer", type: "address" },
      { name: "expiry", type: "uint256" },
    ],
    outputs: [{ name: "returned", type: "uint256" }],
  },
  {
    type: "function",
    name: "previewSettleEth",
    stateMutability: "payable",
    inputs: [
      { name: "escrow", type: "address" },
      { name: "to", type: "address" },
      { name: "baseToken", type: "address" },
    ],
    outputs: [{ name: "received", type: "uint256" }],
  },
  {
    type: "function",
    name: "previewSettleUsdg",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrow", type: "address" },
      { name: "to", type: "address" },
      { name: "baseToken", type: "address" },
    ],
    outputs: [{ name: "received", type: "uint256" }],
  },
  {
    type: "function",
    name: "previewCancel",
    stateMutability: "nonpayable",
    inputs: [
      { name: "escrow", type: "address" },
      { name: "recipient", type: "address" },
      { name: "baseToken", type: "address" },
    ],
    outputs: [{ name: "received", type: "uint256" }],
  },
] as const

async function previewCall(
  client: PublicClient,
  account: Address,
  data: `0x${string}`,
  value: bigint,
  functionName: "previewCreateReturn" | "previewSettleEth" | "previewSettleUsdg" | "previewCancel",
): Promise<bigint> {
  const { data: ret } = await client.call({
    account,
    to: account,
    data,
    value,
    gas: 8_000_000n,
    stateOverride: [{ address: account, code: PREVIEW_BYTECODE }],
  })
  if (!ret || ret === "0x") throw new Error("empty preview")
  return decodeFunctionResult({ abi: previewAbi, functionName, data: ret }) as bigint
}

export function previewCreateReturn(
  client: PublicClient,
  account: Address,
  args: {
    factory: Address
    baseToken: Address
    quoteToken: Address
    baseAmount: bigint
    quoteAmount: bigint
    allowedPayer: Address
    expiry: bigint
  },
): Promise<bigint> {
  return previewCall(
    client,
    account,
    encodeFunctionData({
      abi: previewAbi,
      functionName: "previewCreateReturn",
      args: [
        args.factory,
        args.baseToken,
        args.quoteToken,
        args.baseAmount,
        args.quoteAmount,
        args.allowedPayer,
        args.expiry,
      ],
    }),
    0n,
    "previewCreateReturn",
  )
}

export function previewSettleEth(
  client: PublicClient,
  account: Address,
  args: { escrow: Address; to: Address; baseToken: Address; quoteAmount: bigint },
): Promise<bigint> {
  return previewCall(
    client,
    account,
    encodeFunctionData({
      abi: previewAbi,
      functionName: "previewSettleEth",
      args: [args.escrow, args.to, args.baseToken],
    }),
    args.quoteAmount,
    "previewSettleEth",
  )
}

export function previewSettleUsdg(
  client: PublicClient,
  account: Address,
  args: { escrow: Address; to: Address; baseToken: Address },
): Promise<bigint> {
  return previewCall(
    client,
    account,
    encodeFunctionData({
      abi: previewAbi,
      functionName: "previewSettleUsdg",
      args: [args.escrow, args.to, args.baseToken],
    }),
    0n,
    "previewSettleUsdg",
  )
}

export function previewCancel(
  client: PublicClient,
  account: Address,
  args: { escrow: Address; recipient: Address; baseToken: Address },
): Promise<bigint> {
  return previewCall(
    client,
    account,
    encodeFunctionData({
      abi: previewAbi,
      functionName: "previewCancel",
      args: [args.escrow, args.recipient, args.baseToken],
    }),
    0n,
    "previewCancel",
  )
}
