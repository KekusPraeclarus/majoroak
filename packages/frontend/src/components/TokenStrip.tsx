import { Link } from "react-router-dom"

import { PRESET_TOKENS } from "../tokens"
import { TokenLogo } from "./TokenLogo"

/* A centred row under the panel. It spans the shell, so nothing wraps alone. */
export function TokenStrip() {
  return (
    <section className="strip" aria-labelledby="strip-title">
      <span className="strip-title" id="strip-title">
        Verified markets
      </span>
      <div className="strip-row">
        {PRESET_TOKENS.map((t) => (
          <Link key={t.address} to={`/create?token=${t.address}`} className="strip-item">
            <TokenLogo address={t.address} symbol={t.symbol} size={20} />
            {t.symbol}
          </Link>
        ))}
      </div>
      <Link className="btn-link" to="/market">
        See open deals
      </Link>
    </section>
  )
}
