import { useEffect, useState } from "react";

export type PresetToken = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  logo?: string;
};

/**
 * Local/testnet override: VITE_LOCAL_TOKENS="0xaddr|SYMBOL|Name,0xaddr|SYMBOL|Name"
 * When set, it replaces the mainnet preset list entirely.
 */
function parseLocalTokens(): PresetToken[] | undefined {
  const raw = import.meta.env.VITE_LOCAL_TOKENS as string | undefined;
  if (!raw) return undefined;
  const parsed = raw
    .split(",")
    .map((entry) => {
      const [address, symbol, name] = entry.split("|").map((s) => s.trim());
      if (!/^0x[0-9a-fA-F]{40}$/.test(address ?? "")) return undefined;
      return {
        address: address as `0x${string}`,
        symbol: symbol || "TOKEN",
        name: name || symbol || "Token",
      };
    })
    .filter((t): t is PresetToken => !!t);
  return parsed.length > 0 ? parsed : undefined;
}

const MAINNET_TOKENS: PresetToken[] = [
  {
    address: "0x020bfc650a365f8bb26819deaabf3e21291018b4",
    symbol: "CASHCAT",
    name: "Cash Cat",
    logo: "https://cdn.dexscreener.com/cms/images/Lq7a3pS9Wn8EuGp0?width=128&height=128&quality=95&format=auto",
  },
];

export const PRESET_TOKENS: PresetToken[] = parseLocalTokens() ?? MAINNET_TOKENS;

export const presetFor = (address?: string) =>
  address
    ? PRESET_TOKENS.find((t) => t.address.toLowerCase() === address.toLowerCase())
    : undefined;

/** Runtime logo lookup for arbitrary tokens via the Dexscreener API, cached per address. */
const logoCache = new Map<string, string | null>();

export function useTokenLogo(address?: string): string | undefined {
  const preset = presetFor(address);
  const [logo, setLogo] = useState<string | undefined>(preset?.logo);

  useEffect(() => {
    if (!address) {
      setLogo(undefined);
      return;
    }
    const pre = presetFor(address);
    if (pre) {
      setLogo(pre.logo);
      return;
    }
    const key = address.toLowerCase();
    if (logoCache.has(key)) {
      setLogo(logoCache.get(key) ?? undefined);
      return;
    }
    setLogo(undefined);
    let alive = true;
    fetch(`https://api.dexscreener.com/tokens/v1/robinhood/${key}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((pairs: Array<{ info?: { imageUrl?: string } }>) => {
        const url =
          (Array.isArray(pairs) &&
            pairs.find((p) => p.info?.imageUrl)?.info?.imageUrl) ||
          null;
        logoCache.set(key, url);
        if (alive) setLogo(url ?? undefined);
      })
      .catch(() => {
        logoCache.set(key, null);
      });
    return () => {
      alive = false;
    };
  }, [address]);

  return logo;
}
