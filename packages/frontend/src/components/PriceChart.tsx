import { useEffect, useMemo, useRef, useState } from "react"

import { fmtUsdCompact, useOhlcv } from "../lib/prices";

const W = 460;
const H = 150;
const PAD = { top: 14, right: 8, bottom: 20, left: 8 };
function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export function PriceChart({
  tokenAddress,
  symbol,
  otcUnitPrice,
}: {
  tokenAddress?: string;
  symbol: string;
  /** implied USD price per token of this OTC deal */
  otcUnitPrice?: number;
}) {
  const { candles, loading } = useOhlcv(tokenAddress);
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const [muted, setMuted] = useState(() => readToken("--mo-text-muted"))

  useEffect(() => {
    const sync = () => setMuted(readToken("--mo-text-muted"))
    sync()
    const mo = new MutationObserver(sync)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => mo.disconnect()
  }, [])

  const geom = useMemo(() => {
    if (!candles || candles.length < 2) return undefined;
    const closes = candles.map((c) => c.close);
    let min = Math.min(...closes);
    let max = Math.max(...closes);
    if (otcUnitPrice !== undefined && Number.isFinite(otcUnitPrice)) {
      min = Math.min(min, otcUnitPrice);
      max = Math.max(max, otcUnitPrice);
    }
    if (min === max) {
      min *= 0.95;
      max *= 1.05;
    }
    const span = max - min;
    min -= span * 0.08;
    max += span * 0.08;
    const x = (i: number) =>
      PAD.left + (i / (candles.length - 1)) * (W - PAD.left - PAD.right);
    const y = (v: number) =>
      PAD.top + (1 - (v - min) / (max - min)) * (H - PAD.top - PAD.bottom);
    const path = candles
      .map((c, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(c.close).toFixed(1)}`)
      .join(" ");
    return { x, y, path, min, max };
  }, [candles, otcUnitPrice]);

  if (loading) {
    return (
      <div className="chart">
        <div className="chart-head">
          <span className="label">{symbol} market price · 72 hours</span>
        </div>
        <span className="skeleton" style={{ height: 120 }} />
      </div>
    );
  }
  if (!geom || !candles) return null;

  const last = candles[candles.length - 1];
  const hovered = hover !== null ? candles[hover] : undefined;
  const otcY =
    otcUnitPrice !== undefined && Number.isFinite(otcUnitPrice)
      ? geom.y(otcUnitPrice)
      : undefined;

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const frac = (px - PAD.left) / (W - PAD.left - PAD.right);
    const i = Math.round(frac * (candles.length - 1));
    setHover(Math.max(0, Math.min(candles.length - 1, i)));
  };

  const tipLeft = hover !== null ? (geom.x(hover) / W) * 100 : 0;
  const tipTop = hovered ? (geom.y(hovered.close) / H) * 100 : 0;

  return (
    <div className="chart" ref={wrapRef}>
      <div className="chart-head">
        <span className="label">{symbol} market price · 72 hours</span>
        <span className="v">{fmtUsdCompact(hovered ? hovered.close : last.close)}</span>
      </div>

      <svg
        className="chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${symbol} hourly price over the last 72 hours`}
      >
        {/* recessive baseline grid */}
        <line className="grid-line" x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} strokeWidth="1" />

        <path className="price-line" d={geom.path} strokeLinejoin="miter" strokeLinecap="butt" />

        {otcY !== undefined && (
          <>
            <line
              className="ref-line"
              x1={PAD.left}
              y1={otcY}
              x2={W - PAD.right}
              y2={otcY}
              stroke={muted}
            />
            <text className="ref-label" x={PAD.left} y={otcY - 6} fill={muted}>
              Deal {fmtUsdCompact(otcUnitPrice)}
            </text>
          </>
        )}

        {/* crosshair + marker */}
        {hovered && hover !== null && (
          <>
            <line
              className="cross-line"
              x1={geom.x(hover)}
              y1={PAD.top}
              x2={geom.x(hover)}
              y2={H - PAD.bottom}
              strokeWidth="1"
            />
            <circle
              className="cross-dot"
              cx={geom.x(hover)}
              cy={geom.y(hovered.close)}
              r="4"
              strokeWidth="2"
            />
          </>
        )}

        {/* time labels */}
        <text className="axis-t" x={PAD.left} y={H - 6}>
          {new Date(candles[0].t * 1000).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </text>
        <text className="axis-t" x={W - PAD.right} y={H - 6} textAnchor="end">
          Now
        </text>
      </svg>

      {hovered && (
        <div className="chart-tip" style={{ left: `${tipLeft}%`, top: `${tipTop}%` }}>
          {fmtUsdCompact(hovered.close)}
          <div className="tip-sub">
            {new Date(hovered.t * 1000).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
            })}
          </div>
        </div>
      )}
    </div>
  );
}
