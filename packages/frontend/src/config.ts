import { http, createConfig, createStorage } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID ?? 4663);
const RPC_URL =
  import.meta.env.VITE_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com";
const EXPLORER_URL =
  import.meta.env.VITE_EXPLORER_URL ?? "https://robinhoodchain.blockscout.com";

export const ANVIL_ACCOUNT = (import.meta.env.VITE_ANVIL_ACCOUNT ?? "") as string;
export const IS_ANVIL = ANVIL_ACCOUNT.startsWith("0x");

export const robinhoodChain = defineChain({
  id: CHAIN_ID,
  name:
    CHAIN_ID === 4663
      ? "Robinhood Chain"
      : CHAIN_ID === 31337
        ? "MajorOak Anvil"
        : `Chain ${CHAIN_ID}`,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: {
    default: { name: "Blockscout", url: EXPLORER_URL },
  },
  contracts: {
    // Canonical Multicall3, deployed on Robinhood Chain mainnet (and inherited
    // by forks). Required by viem's client.multicall in the discovery fallback.
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
});

export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected()],
  transports: { [robinhoodChain.id]: http(RPC_URL) },
  // Versioned storage key: bump to invalidate stale persisted connections
  // (prevents "connection.connector.getChainId is not a function" after env changes).
  storage: createStorage({ storage: localStorage, key: `majoroak-w2-${CHAIN_ID}` }),
});

/** Set after deploy: VITE_FACTORY_ADDRESS in .env(.local) */
export const FACTORY_ADDRESS = (import.meta.env.VITE_FACTORY_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const FACTORY_DEPLOYED =
  FACTORY_ADDRESS !== "0x0000000000000000000000000000000000000000";

/** First block to scan for EscrowCreated events (set to factory deploy block). */
export const START_BLOCK = BigInt(import.meta.env.VITE_START_BLOCK ?? 0);

/** Indexer origin. Production discovery requires this. */
export const INDEXER_URL = String(import.meta.env.VITE_INDEXER_URL ?? "").replace(/\/$/, "")

/** Development-only. When "1", the UI may scan the factory from the browser. */
export const INDEXER_FALLBACK = import.meta.env.VITE_INDEXER_FALLBACK === "1"

/**
 * Where the application lives. An empty value means the same origin.
 * In production the application sits on its own host, so set VITE_APP_URL.
 */
export const APP_BASE = String(import.meta.env.VITE_APP_URL ?? "").replace(/\/$/, "")

/** True when the application sits on another host, so a link leaves this one. */
export const APP_EXTERNAL = APP_BASE.startsWith("http")

export const appHref = (path: string) => `${APP_BASE}${path}`

/**
 * Where the marketing pages live. An empty value means the same origin.
 * On the application host set VITE_SITE_URL, so the brand mark reaches the front door.
 */
export const SITE_BASE = String(import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "")

/** True when the marketing pages sit on another host, so a link leaves this one. */
export const SITE_EXTERNAL = SITE_BASE.startsWith("http")

export const siteHref = (path: string) => `${SITE_BASE}${path}`

export const explorerUrl = (path: string) => `${EXPLORER_URL}${path}`;
