import wordmark from "../../../../docs/brand/assets/wordmark.svg"
import { explorerUrl, FACTORY_ADDRESS, FACTORY_DEPLOYED } from "../config"
import { short } from "../lib/format"
import { AppLink, SiteLink } from "./AppLink"

const X_URL = "https://x.com/MajorOakOTC"

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner shell">
        <div>
          <div className="footer-identity">
            <SiteLink className="brand" aria-label="MajorOak">
              {/* The wordmark matches the tagline ink. Read docs/brand/logo.md. */}
              <span
                className="brand-wordmark"
                style={{ ["--lockup" as string]: `url(${wordmark})` }}
              />
            </SiteLink>
            <p className="footer-tagline">Settled, not shopped.</p>
          </div>
          <p className="footer-disclosure">
            MajorOak is independent, non-custodial software for OTC deals on Robinhood Chain. It is
            not affiliated with, endorsed by, or connected to Robinhood Markets, Inc. or any of its
            affiliates. Nothing here is financial, investment, or legal advice. Digital assets are
            volatile and you can lose the full value of what you trade. Check the domain and the
            contract address before you sign a transaction.
          </p>
          {FACTORY_DEPLOYED && (
            <p className="footer-factory">
              <span className="label">Factory</span>
              <a
                className="mono"
                href={explorerUrl(`/address/${FACTORY_ADDRESS}`)}
                target="_blank"
                rel="noreferrer"
                title={FACTORY_ADDRESS}
              >
                {short(FACTORY_ADDRESS)}
              </a>
            </p>
          )}
        </div>
        <div className="footer-cols">
          {/* Each column reaches its own host, so a link works from either side. */}
          <div className="footer-col">
            <span className="footer-col-title">App</span>
            <AppLink to="/create">Create</AppLink>
            <AppLink to="/market">Market</AppLink>
            <AppLink to="/deals">My deals</AppLink>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Company</span>
            <SiteLink to="/about">About</SiteLink>
            <SiteLink to="/name">Lore</SiteLink>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Legal</span>
            <SiteLink to="/terms">Terms</SiteLink>
            <SiteLink to="/privacy">Privacy</SiteLink>
          </div>
          <div className="footer-col">
            <span className="footer-col-title">Elsewhere</span>
            <a href={X_URL} target="_blank" rel="noreferrer">
              X
            </a>
          </div>
        </div>
      </div>
      <div className="shell">
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} MajorOak. All rights reserved.</span>
          <span>You trade at your own risk.</span>
        </div>
      </div>
    </footer>
  )
}
