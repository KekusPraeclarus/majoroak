import { useState } from "react"

import { useTokenLogo } from "../tokens"

export const VARIANT_LOGOS = {
  eth: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  usdg: "https://coin-images.coingecko.com/coins/images/51281/small/GDN_USDG_Token_200x200.png",
} as const

/** A token logo never exceeds 32px. Read docs/brand/iconography.md. */
export function TokenLogo({
  address,
  symbol,
  variant,
  size = 24,
}: {
  address?: string
  symbol: string
  variant?: "eth" | "usdg"
  size?: number
}) {
  const tokenLogo = useTokenLogo(address)
  const logo = tokenLogo ?? (variant ? VARIANT_LOGOS[variant] : undefined)
  const [broken, setBroken] = useState(false)
  const box = Math.min(size, 32)

  if (logo && !broken) {
    return (
      <img
        className="token-img"
        src={logo}
        alt=""
        width={box}
        height={box}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <span
      className="token-fallback"
      style={{ width: box, height: box, fontSize: Math.round(box * 0.45) }}
      aria-hidden="true"
    >
      {symbol.slice(0, 1).toUpperCase()}
    </span>
  )
}
