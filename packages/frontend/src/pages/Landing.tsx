import { useState } from "react"
import { Link } from "react-router-dom"

import lockupStackedMetal from "../../../../docs/brand/assets/lockup-stacked-metal.svg"
import lockupStacked from "../../../../docs/brand/assets/lockup-stacked.svg"
import { AppLink } from "../components/AppLink"
import { ArrowUpRight } from "../components/Icon"
import { explorerUrl, FACTORY_ADDRESS, FACTORY_DEPLOYED } from "../config"
import { fmtUsdCompact } from "../lib/prices"
import { useProtocolStats } from "../lib/protocol-stats"

const REPO_URL = "https://github.com/KekusPraeclarus/otc"

function fmtStatUsd(value: number, priced: boolean): string {
  if (!priced) return "—"
  return `≈ ${fmtUsdCompact(value)}`
}

const STEPS = [
  {
    n: "01",
    title: "The seller funds an escrow",
    body: "The factory deploys one escrow for one deal. The seller sends the base asset into it and sets the price.",
  },
  {
    n: "02",
    title: "The buyer pays the quoted total",
    body: "The buyer pays in ETH or USDG. The contract measures the amount that arrived, not the amount that was claimed.",
  },
  {
    n: "03",
    title: "The contract settles both legs",
    body: "One transaction moves both sides. If any part fails, nothing moves and the asset stays in escrow.",
  },
]

const MECHANISMS = [
  {
    eyebrow: "No pool",
    title: "Your size does not move the price",
    body: "There is no pool and no order book. Two parties who agreed a price use the contract to complete the deal.",
  },
  {
    eyebrow: "One transaction",
    title: "Both sides move together",
    body: "The contract settles the asset and the payment together. If any part fails, nothing moves.",
  },
  {
    eyebrow: "Fixed fee",
    title: "The fee cannot change",
    body: "The official protocol fee is 1%. It is set when the factory is deployed. It cannot be changed later by anyone.",
  },
  {
    eyebrow: "Expiry",
    title: "A deal has a due day",
    body: "Every deal ends at a set time. After it passes, the seller reclaims the base asset from the escrow.",
  },
  {
    eyebrow: "Named payer",
    title: "One address, or anyone",
    body: "You can restrict a deal to one address. You can also leave it open to any payer.",
  },
  {
    eyebrow: "Measured balance",
    title: "The count decides",
    body: "The contract checks the balance it received. A token that reports one amount and sends another reverts the deal.",
  },
]

const LIMITS = [
  {
    title: "It does not hold your keys",
    body: "You sign every transaction from your own wallet. An escrow contract holds the asset.",
  },
  {
    title: "It does not make the chain private",
    body: "Robinhood Chain is public. Anyone can see the deal, the addresses, and the amounts. A restricted payer limits who may settle. Anyone can still see the deal.",
  },
  {
    title: "It does not vouch for a token",
    body: "Anyone can create a token with any name or symbol. Check the token contract address before you pay.",
  },
  {
    title: "It does not reverse a mistake",
    body: "A transfer to a wrong address cannot be undone. Check every address before you sign a transaction.",
  },
]

const SEEN_KEY = "majoroak-hero-seen"

/* The emblem arrives once per session. Read docs/brand/motion/inventory.md. */
function useFirstView(): boolean {
  const [first] = useState(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return false
      sessionStorage.setItem(SEEN_KEY, "1")
      return true
    } catch {
      return true
    }
  })
  return first
}

export function LandingPage() {
  const stats = useProtocolStats()
  const firstView = useFirstView()
  /* An empty record proves nothing, so the band waits for real activity. */
  const showStats = stats.ready && stats.uniqueWallets > 0

  return (
    <main className="page landing" id="main">
      <section className="hero shell">
        {/* The metal wordmark is the one metal element, and only on a dark field. */}
        <span
          className={`hero-lockup${firstView ? " arrive" : ""}`}
          role="img"
          aria-label="MajorOak Settlements"
        >
          <img className="hero-lockup-metal" src={lockupStackedMetal} alt="" />
          <span
            className="hero-lockup-flat"
            style={{ ["--lockup" as string]: `url(${lockupStacked})` }}
          />
        </span>
        <h1 className="hero-title">Settled, not shopped.</h1>
        <p className="hero-sub">
          An over-the-counter escrow desk for ERC-20 tokens on Robinhood Chain. One transaction moves
          both sides. If any part fails, nothing moves.
        </p>
        <div className="hero-actions">
          <AppLink className="btn primary lg">Open the app</AppLink>
          <Link className="btn secondary lg" to="/market">
            See open deals
          </Link>
        </div>
        <p className="hero-meta">
          <span>No pool</span>
          <span>No order book</span>
          <span>No price impact</span>
        </p>
      </section>

      <div className="shell">
        <div className="hero-rule lozenge-rule" aria-hidden="true">
          <span className="lozenge" />
        </div>
      </div>

      <div className="shell">
        <section className="section" aria-labelledby="how">
          <div className="section-head">
            <span className="eyebrow">How a deal settles</span>
            <h2 id="how" className="title-section">
              Three steps, in one transaction
            </h2>
          </div>
          <ol className="steps">
            {STEPS.map((step) => (
              <li className="step" key={step.n}>
                <span className="step-n">{step.n}</span>
                <h3 className="step-title">{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="mechanism">
          <div className="section-head">
            <span className="eyebrow">What the desk removes</span>
            <h2 id="mechanism" className="title-section">
              A large deal, without the pool
            </h2>
          </div>
          <div className="feature-grid">
            {MECHANISMS.map((item) => (
              <div className="feature" key={item.eyebrow}>
                <span className="eyebrow">{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {showStats && (
          <section className="section" aria-labelledby="record">
            <div className="section-head">
              <span className="eyebrow">The record</span>
              <h2 id="record" className="title-section">
                What the chain shows
              </h2>
            </div>
            <div className="stats">
              <div className="stat-tile">
                <span className="l">Settled volume</span>
                <span className="v">{fmtStatUsd(stats.settledUsd, stats.settledPriced)}</span>
              </div>
              <div className="stat-tile">
                <span className="l">Value in escrow</span>
                <span className="v">{fmtStatUsd(stats.lockedUsd, stats.lockedPriced)}</span>
              </div>
              <div className="stat-tile">
                <span className="l">Verified markets</span>
                <span className="v">{stats.verifiedMarkets.toLocaleString("en-US")}</span>
              </div>
              <div className="stat-tile">
                <span className="l">Unique wallets</span>
                <span className="v">{stats.uniqueWallets.toLocaleString("en-US")}</span>
              </div>
            </div>
            <p className="stats-note">
              A dollar figure is an estimate. USDG counts as one dollar, and ETH uses a market price.
            </p>
          </section>
        )}

        <section className="section" aria-labelledby="limits">
          <div className="section-head">
            <span className="eyebrow">The limits</span>
            <h2 id="limits" className="title-section">
              What this does not do
            </h2>
          </div>
          <ul className="limit-list">
            {LIMITS.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section" aria-labelledby="proof">
          <div className="section-head">
            <span className="eyebrow">Proof</span>
            <h2 id="proof" className="title-section">
              Read it yourself
            </h2>
          </div>
          <ul className="proof-list">
            {FACTORY_DEPLOYED && (
              <li>
                <span className="k">Factory contract</span>
                <a
                  className="btn-link mono"
                  href={explorerUrl(`/address/${FACTORY_ADDRESS}`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {FACTORY_ADDRESS}
                  <ArrowUpRight size={14} />
                </a>
              </li>
            )}
            <li>
              <span className="k">Source</span>
              <a className="btn-link" href={REPO_URL} target="_blank" rel="noreferrer">
                The repository
                <ArrowUpRight size={14} />
              </a>
            </li>
          </ul>
        </section>

        <section className="section name-note" aria-labelledby="name">
          <div className="name-note-head">
            <span className="eyebrow">The name</span>
            <h2 id="name" className="title-section">
              A fixed point people met at
            </h2>
          </div>
          <div className="name-note-body">
            <p>
              The Major Oak stands in Sherwood Forest near Edwinstowe. For centuries it was the fixed
              point people met at. We took the name for the same reason.
            </p>
            <Link className="btn-link" to="/name">
              Read the lore
            </Link>
          </div>
        </section>

        <section className="closing">
          <h2 className="title-section">Open the app when you have agreed a price.</h2>
          <p className="closing-lede">
            The seller funds the escrow. The buyer pays the total. The contract settles both legs. If
            any part fails, nothing moves.
          </p>
          <div className="hero-actions">
            <AppLink className="btn primary lg">Open the app</AppLink>
            <Link className="btn ghost lg" to="/about">
              How it works
            </Link>
          </div>
          <p className="closing-risk">
            Digital assets are volatile. You can lose the full value of what you trade.
          </p>
        </section>
      </div>
    </main>
  )
}
