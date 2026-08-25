/**
 * Demo data for UI testing (enabled with VITE_DEMO=1).
 * Fake open orders and personal deals built on the real mainnet preset tokens.
 * Delete VITE_DEMO from .env.local once real deals exist on-chain.
 */
import { ZERO } from "./lib/format";

export const IS_DEMO = import.meta.env.VITE_DEMO === "1";

/** Placeholder for the not-yet-pinned mainnet USDG address. */
export const DEMO_USDG = "0x00000000000000000000000000000000000d0119" as `0x${string}`;

const T = {
  STONKBROKER: "0xe934e36a439c94017b64a3fece66af12099abf50",
  CASHCAT: "0x020bfc650a365f8bb26819deaabf3e21291018b4",
  TENDIES: "0x45242320dbb855eea8fd36804c6487e10e97fcf9",
  PONS: "0x39dbed3a2bd333467115de45665cc57f813c4571",
  INDEX: "0x56910d4409f3a0c78c64dd8d0545ff0705389870",
  UP: "0x57c0e45cb534413d1c20a4240955d6bb250bb4f1",
} as const;

const E18 = 10n ** 18n;
const E6 = 10n ** 6n;
const now = () => Math.floor(Date.now() / 1000);

export type DemoDeal = {
  escrow: `0x${string}`;
  seller: `0x${string}`;
  baseToken: `0x${string}`;
  baseAmount: bigint;
  quoteKind: "ETH" | "USDG";
  quoteAmount: bigint;
  quoteDecimals: number;
  allowedPayer: `0x${string}`;
  expiry: bigint;
  /** 0 Created, 1 Open, 2 Settled, 3 Cancelled */
  state: number;
  usdValue: number;
  role?: "seller" | "buyer";
};

const SELLERS = [
  "0x8ba1f109551bd432803012645ac136ddd64dba72",
  "0x2546bcd3c84621e976d8185a91a922ae77ecec30",
  "0xbda5747bfd65f08deb54cb465eb87d40e51b197e",
] as const;

const deal = (
  n: number,
  baseToken: string,
  baseUnits: number,
  quoteKind: "ETH" | "USDG",
  quoteUnits: number,
  hoursLeft: number,
  usdValue: number,
  extra?: Partial<DemoDeal>,
): DemoDeal => ({
  escrow: `0xdea1${"0".repeat(34)}${String(n).padStart(2, "0")}` as `0x${string}`,
  seller: SELLERS[n % SELLERS.length],
  baseToken: baseToken as `0x${string}`,
  baseAmount: BigInt(baseUnits) * E18,
  quoteKind,
  quoteAmount:
    quoteKind === "ETH"
      ? BigInt(Math.round(quoteUnits * 1e6)) * (E18 / 1000000n)
      : BigInt(Math.round(quoteUnits * 1e6)),
  quoteDecimals: quoteKind === "ETH" ? 18 : 6,
  allowedPayer: ZERO,
  expiry: BigInt(now() + Math.round(hoursLeft * 3600)),
  state: 1,
  usdValue,
  ...extra,
});

/** Public open orders shown in Current markets. */
export const DEMO_MARKETS: DemoDeal[] = [
  deal(1, T.UP, 80_000, "USDG", 23_000, 2.5, 23_000),
  deal(2, T.TENDIES, 1_000_000, "USDG", 17_500, 6, 17_500),
  deal(3, T.STONKBROKER, 100_000, "USDG", 3_100, 12, 3_100),
  deal(4, T.STONKBROKER, 2_500_000, "ETH", 15.9, 18, 70_000),
  deal(5, T.PONS, 500_000, "ETH", 4.5, 36, 19_800),
  deal(6, T.CASHCAT, 150_000, "USDG", 23_250, 72, 23_250),
  deal(7, T.INDEX, 3_000_000, "USDG", 24_000, 120, 24_000),
];

/** Personal deals shown in My Deals. */
export const DEMO_MY_DEALS: DemoDeal[] = [
  deal(8, T.TENDIES, 250_000, "USDG", 4_600, 20, 4_600, { role: "seller" }),
  deal(9, T.UP, 40_000, "USDG", 11_800, 48, 11_800, {
    role: "buyer",
    allowedPayer: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  }),
  deal(10, T.CASHCAT, 90_000, "USDG", 14_400, -1, 14_400, { role: "seller" }),
  deal(11, T.STONKBROKER, 1_200_000, "ETH", 8.2, 0, 36_000, { role: "seller", state: 2 }),
  deal(12, T.PONS, 600_000, "ETH", 5.4, 0, 23_700, { role: "seller", state: 3 }),
];

export const demoFor = (escrow: string): DemoDeal | undefined =>
  [...DEMO_MARKETS, ...DEMO_MY_DEALS].find(
    (d) => d.escrow.toLowerCase() === escrow.toLowerCase(),
  );
