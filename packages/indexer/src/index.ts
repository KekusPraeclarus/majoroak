import { D1Store } from "./d1-store"
import {
  healthResponse,
  isAddress,
  json,
  marketsResponse,
  statsResponse,
  walletDealsResponse,
} from "./api"
import { HttpRpc } from "./rpc"
import { runSync } from "./sync"
import { addr, type SyncConfig } from "./types"

export type Env = {
  DB: D1Database
  RPC_URL: string
  CHAIN_ID: string
  FACTORY_ADDRESS: string
  START_BLOCK: string
  CONFIRMATIONS: string
  RANGE_SIZE: string
  REWIND_BLOCKS: string
  FRONTEND_ORIGIN: string
  SYNC_TOKEN?: string
}

function configFrom(env: Env): SyncConfig {
  return {
    factory: addr(env.FACTORY_ADDRESS),
    startBlock: BigInt(env.START_BLOCK || "0"),
    confirmations: BigInt(env.CONFIRMATIONS || "8"),
    rangeSize: BigInt(env.RANGE_SIZE || "2000"),
    rewindBlocks: BigInt(env.REWIND_BLOCKS || "32"),
  }
}

function origin(env: Env, request: Request): string {
  const allowed = env.FRONTEND_ORIGIN || "*"
  if (allowed === "*") return "*"
  const requestOrigin = request.headers.get("origin")
  if (requestOrigin && requestOrigin === allowed) return allowed
  return allowed
}

async function syncNow(env: Env) {
  const store = new D1Store(env.DB)
  const rpc = new HttpRpc(env.RPC_URL)
  return runSync(store, rpc, configFrom(env))
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = origin(env, request)
    if (request.method === "OPTIONS") {
      return json({}, cors, 204, "no-store")
    }

    if (url.pathname === "/v1/sync" && request.method === "POST") {
      const token = request.headers.get("authorization")?.replace(/^Bearer /i, "")
      if (!env.SYNC_TOKEN || token !== env.SYNC_TOKEN) {
        return json({ error: "Unauthorized" }, cors, 401, "no-store")
      }
      const result = await syncNow(env)
      return json({ ok: true, ranges: result }, cors, 200, "no-store")
    }

    if (request.method !== "GET") {
      return json({ error: "Method not allowed" }, cors, 405, "no-store")
    }

    const store = new D1Store(env.DB)
    const factory = addr(env.FACTORY_ADDRESS)
    const chainId = Number(env.CHAIN_ID || "4663")

    if (url.pathname === "/health") {
      let head: number | null = null
      try {
        head = Number(await new HttpRpc(env.RPC_URL).getBlockNumber())
      } catch {
        head = null
      }
      return json(await healthResponse(store, factory, chainId, head), cors, 200, "no-store")
    }

    if (url.pathname === "/v1/stats") {
      return json(await statsResponse(store), cors)
    }

    if (url.pathname === "/v1/markets") {
      return json(await marketsResponse(store), cors)
    }

    if (url.pathname === "/v1/deals") {
      const wallet = url.searchParams.get("wallet") ?? ""
      if (!isAddress(wallet)) {
        return json({ error: "wallet must be a 0x address" }, cors, 400, "no-store")
      }
      return json(await walletDealsResponse(store, wallet), cors)
    }

    return json({ error: "Not found" }, cors, 404, "no-store")
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await syncNow(env)
  },
}
