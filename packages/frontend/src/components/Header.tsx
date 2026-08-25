import { useEffect } from "react"
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi"

import emblemMark from "../../../../docs/brand/assets/emblem-mark.svg"
import { IS_ANVIL, robinhoodChain } from "../config"
import { short } from "../lib/format"
import { AppLink, SiteLink } from "./AppLink"
import { Nav } from "./Nav"
import { ThemeToggle } from "./ThemeToggle"

type Props = {
  /* A marketing route holds no wallet control. Read docs/brand/web-application.md. */
  marketing?: boolean
}

export function Header({ marketing = false }: Props) {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const onRobinhood = chainId === robinhoodChain.id
  const wrongChain = !marketing && isConnected && !onRobinhood

  useEffect(() => {
    if (!IS_ANVIL || isConnected || isPending) return
    const connector = connectors[0]
    if (!connector) return
    connect({ connector })
  }, [connect, connectors, isConnected, isPending])

  return (
    <>
      <header className="header">
        <div className="header-bar shell">
          <SiteLink className="brand" aria-label="MajorOak">
            {/* The header uses the emblem. The footer uses the wordmark. */}
            <span
              className="brand-emblem"
              style={{ ["--lockup" as string]: `url(${emblemMark})` }}
            />
          </SiteLink>
          <Nav />
          <div className="header-right">
            {!marketing && (
              <span className="chain-indicator">
                {isConnected && onRobinhood && <span className="dot-live" aria-hidden="true" />}
                {robinhoodChain.name}
              </span>
            )}
            <ThemeToggle />
            {marketing ? (
              <AppLink className="btn primary">
                <span className="on-wide">Open the app</span>
                <span className="on-narrow">Open</span>
              </AppLink>
            ) : isConnected ? (
              <button
                type="button"
                className="btn secondary"
                onClick={() => disconnect()}
                title="Disconnect this wallet"
              >
                <span className="mono">{short(address)}</span>
              </button>
            ) : (
              <button
                type="button"
                className="btn primary"
                disabled={isPending}
                onClick={() => connect({ connector: connectors[0] })}
              >
                {isPending ? (
                  "Connecting…"
                ) : (
                  <>
                    <span className="on-wide">Connect a wallet</span>
                    <span className="on-narrow">Connect</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>
      {wrongChain && (
        <div className="chain-banner" role="status">
          <span>This wallet is on another chain. Nothing can move until you switch.</span>
          <button type="button" onClick={() => switchChain({ chainId: robinhoodChain.id })}>
            Switch to {robinhoodChain.name}
          </button>
        </div>
      )}
    </>
  )
}
