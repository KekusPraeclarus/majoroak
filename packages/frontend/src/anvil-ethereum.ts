type RpcRequest = {
  method: string
  params?: unknown
}

const ACCOUNT = import.meta.env.VITE_ANVIL_ACCOUNT as string | undefined
const RPC_URL = import.meta.env.VITE_RPC_URL as string | undefined
const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? 31337)
const ENABLED = import.meta.env.MODE === "anvil" && Boolean(ACCOUNT) && Boolean(RPC_URL)

function hexChainId(id: number) {
  return `0x${id.toString(16)}`
}

async function rpc(method: string, params?: unknown) {
  const res = await fetch(RPC_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: params ?? [] }),
  })
  const body = await res.json()
  if (body.error) {
    const err = new Error(body.error.message ?? "RPC error") as Error & { code?: number }
    err.code = body.error.code
    throw err
  }
  return body.result
}

function installAnvilProvider() {
  if (!ENABLED || typeof window === "undefined") return

  const account = ACCOUNT as string
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>()

  const provider = {
    isMetaMask: false,
    request: async ({ method, params }: RpcRequest) => {
      if (method === "eth_requestAccounts" || method === "eth_accounts") {
        return [account]
      }
      if (method === "eth_chainId") {
        return hexChainId(CHAIN_ID)
      }
      if (method === "net_version") {
        return String(CHAIN_ID)
      }
      if (method === "wallet_switchEthereumChain" || method === "wallet_addEthereumChain") {
        return null
      }
      if (method === "eth_sendTransaction") {
        const list = Array.isArray(params) ? params : []
        const tx = (list[0] ?? {}) as Record<string, unknown>
        return rpc("eth_sendTransaction", [{ ...tx, from: account }])
      }
      return rpc(method, params)
    },
    on: (event: string, cb: (...args: unknown[]) => void) => {
      const set = listeners.get(event) ?? new Set<(...args: unknown[]) => void>()
      set.add(cb)
      listeners.set(event, set)
    },
    removeListener: (event: string, cb: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(cb)
    },
  }

  Object.defineProperty(window, "ethereum", {
    value: provider,
    writable: true,
    configurable: true,
  })
}

installAnvilProvider()
