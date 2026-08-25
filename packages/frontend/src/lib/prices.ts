import { useQuery } from "@tanstack/react-query";

const WETH = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";

type DsPair = {
  baseToken?: { address?: string };
  quoteToken?: { address?: string };
  priceUsd?: string;
  priceNative?: string;
  liquidity?: { usd?: number };
};

async function fetchUsdPrice(address: string): Promise<number | null> {
  const res = await fetch(
    `https://api.dexscreener.com/tokens/v1/robinhood/${address.toLowerCase()}`,
  );
  if (!res.ok) return null;
  const pairs: DsPair[] = await res.json();
  if (!Array.isArray(pairs) || pairs.length === 0) return null;
  const best = pairs
    .filter((p) => p.baseToken?.address?.toLowerCase() === address.toLowerCase())
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  const price = best?.priceUsd ? Number(best.priceUsd) : NaN;
  return Number.isFinite(price) ? price : null;
}

/** USD price of one unit of an ERC-20 on Robinhood Chain (Dexscreener, 60s cache). */
export function useUsdPrice(address?: string): number | undefined {
  const q = useQuery({
    queryKey: ["usd-price", address?.toLowerCase()],
    enabled: !!address,
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: () => fetchUsdPrice(address!),
  });
  return q.data ?? undefined;
}

/**
 * USD price of native ETH. WETH sits on the quote side of most pairs, so derive
 * it from the deepest pair's USD/native price ratio (both refer to the base token).
 */
export function useEthUsd(): number | undefined {
  const q = useQuery({
    queryKey: ["eth-usd"],
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<number | null> => {
      const res = await fetch(`https://api.dexscreener.com/tokens/v1/robinhood/${WETH}`);
      if (!res.ok) return null;
      const pairs: DsPair[] = await res.json();
      if (!Array.isArray(pairs)) return null;
      for (const p of pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))) {
        if (p.baseToken?.address?.toLowerCase() === WETH && p.priceUsd) {
          const v = Number(p.priceUsd);
          if (Number.isFinite(v) && v > 0) return v;
        }
        if (p.quoteToken?.address?.toLowerCase() === WETH && p.priceUsd && p.priceNative) {
          const v = Number(p.priceUsd) / Number(p.priceNative);
          if (Number.isFinite(v) && v > 0) return v;
        }
      }
      return null;
    },
  });
  return q.data ?? undefined;
}

export type Candle = { t: number; close: number };

/** ~72h of hourly closes for a token's deepest pool (GeckoTerminal). */
export function useOhlcv(address?: string): {
  candles: Candle[] | undefined;
  loading: boolean;
} {
  const q = useQuery({
    queryKey: ["ohlcv", address?.toLowerCase()],
    enabled: !!address,
    staleTime: 300_000,
    retry: 1,
    queryFn: async (): Promise<Candle[] | null> => {
      const addr = address!.toLowerCase();
      const poolsRes = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/${addr}/pools?page=1`,
      );
      if (!poolsRes.ok) return null;
      const pools = await poolsRes.json();
      type Pool = {
        attributes?: { address?: string; reserve_in_usd?: string };
        relationships?: { base_token?: { data?: { id?: string } } };
      };
      const byReserve = (a: Pool, b: Pool) =>
        Number(b.attributes?.reserve_in_usd ?? 0) - Number(a.attributes?.reserve_in_usd ?? 0);
      const all: Pool[] = (pools?.data ?? []).slice();
      const isBase = (p: Pool) =>
        (p.relationships?.base_token?.data?.id ?? "").endsWith(addr);
      // Prefer pools where the token is the base side (its canonical market) — quote-side
      // pools can carry manipulated reserves and the wrong price series.
      const sorted = [
        ...all.filter(isBase).sort(byReserve),
        ...all.filter((p) => !isBase(p)).sort(byReserve),
      ];
      for (const pool of sorted.slice(0, 3)) {
        const poolAddr = pool.attributes?.address;
        if (!poolAddr) continue;
        const baseId = pool.relationships?.base_token?.data?.id ?? "";
        const side = baseId.endsWith(addr) ? "base" : "quote";
        const ohlcvRes = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/robinhood/pools/${poolAddr}/ohlcv/hour?aggregate=1&limit=72&token=${side}`,
        );
        if (!ohlcvRes.ok) continue;
        const ohlcv = await ohlcvRes.json();
        const list: number[][] | undefined = ohlcv?.data?.attributes?.ohlcv_list;
        if (!list || list.length < 8) continue;
        return list
          .map((row) => ({ t: row[0], close: row[4] }))
          .filter((c) => Number.isFinite(c.close) && c.close > 0)
          .sort((a, b) => a.t - b.t);
      }
      return null;
    },
  });
  return { candles: q.data ?? undefined, loading: q.isLoading };
}

/** Compact USD: $41.89M, $23.4K, $0.0306 */
export function fmtUsdCompact(n?: number): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  if (abs >= 1) return `$${n.toFixed(2)}`;
  if (abs === 0) return "$0";
  return `$${n.toPrecision(3)}`;
}
