import { FEE_DENOMINATOR_SELECTOR, STATE_SELECTOR } from "./abi"
import { asBlock, asIndex } from "./decode"
import { addr, type RawLog, type Rpc } from "./types"

type JsonRpc = {
  result?: unknown
  error?: { message?: string }
}

async function rpc<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  })
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`)
  const body = (await res.json()) as JsonRpc
  if (body.error) throw new Error(body.error.message ?? "RPC error")
  return body.result as T
}

function hexBlock(value: bigint): string {
  return `0x${value.toString(16)}`
}

function parseLog(raw: {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  transactionHash: string
  logIndex: string
}): RawLog {
  return {
    address: addr(raw.address),
    topics: raw.topics,
    data: raw.data,
    blockNumber: asBlock(raw.blockNumber),
    transactionHash: raw.transactionHash,
    logIndex: asIndex(raw.logIndex),
  }
}

export class HttpRpc implements Rpc {
  constructor(private readonly url: string) {}

  async getBlockNumber(): Promise<bigint> {
    const hex = await rpc<string>(this.url, "eth_blockNumber", [])
    return asBlock(hex)
  }

  async getLogs(args: {
    address?: string
    topics: (string | string[] | null)[]
    fromBlock: bigint
    toBlock: bigint
  }): Promise<RawLog[]> {
    const filter: Record<string, unknown> = {
      fromBlock: hexBlock(args.fromBlock),
      toBlock: hexBlock(args.toBlock),
      topics: args.topics,
    }
    if (args.address) filter.address = args.address
    const logs = await rpc<Array<{
      address: string
      topics: string[]
      data: string
      blockNumber: string
      transactionHash: string
      logIndex: string
    }>>(this.url, "eth_getLogs", [filter])
    return logs.map(parseLog)
  }

  async readStates(addresses: string[]): Promise<Map<string, number>> {
    return this.readUint(addresses, STATE_SELECTOR)
  }

  async readFeeDenominator(factory: string): Promise<number> {
    const values = await this.readUint([factory], FEE_DENOMINATOR_SELECTOR)
    return values.get(addr(factory)) ?? 0
  }

  private async readUint(addresses: string[], selector: string): Promise<Map<string, number>> {
    const out = new Map<string, number>()
    const chunk = 40
    for (let i = 0; i < addresses.length; i += chunk) {
      const slice = addresses.slice(i, i + chunk)
      const results = await Promise.all(
        slice.map((address) =>
          rpc<string>(this.url, "eth_call", [
            { to: address, data: selector },
            "latest",
          ]).catch(() => null),
        ),
      )
      slice.forEach((address, index) => {
        const hex = results[index]
        if (!hex || hex === "0x") return
        out.set(addr(address), Number(BigInt(hex)))
      })
    }
    return out
  }
}
