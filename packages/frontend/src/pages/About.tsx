import { Link } from "react-router-dom"

import { AppLink } from "../components/AppLink"
import { ArrowUpRight } from "../components/Icon"

const REPO_URL = "https://github.com/KekusPraeclarus/otc"

export function AboutPage() {
  return (
    <main className="page shell" id="main">
      <div className="page-column prose-column">
        <div className="page-head">
          <span className="eyebrow">About</span>
          <h1 className="page-title">A settlement house for large token deals</h1>
          <p className="page-sub">
            MajorOak is where a large token deal is settled, not shopped. This page states what the
            product does, what it costs, and what it will not do.
          </p>
        </div>

        <div className="prose">
          <h2>What it is</h2>
          <p>
            MajorOak Settlements is an over-the-counter desk for ERC-20 tokens on Robinhood Chain. A
            seller funds an escrow contract with the asset. A buyer pays the quoted total. One
            transaction moves both sides. If any part fails, nothing moves.
          </p>
          <p>
            A large trade through an automated market maker moves the price against the person making
            it. MajorOak removes the pool. Two parties who have already agreed a price use an escrow
            contract to complete the deal.
          </p>

          <h2>How it settles</h2>
          <p>
            The seller funds an escrow with the base asset. The buyer pays the quoted total in ETH or
            USDG. The contract settles both legs in a single transaction. If any part fails, it
            reverts and nothing moves.
          </p>
          <p>
            Atomic means both legs share one transaction. There is no state where the asset has moved
            and the payment has not.
          </p>
          <p>
            Every deal carries an expiry. Before a payer settles, the seller can cancel. After the
            expiry passes, the seller can reclaim the base asset.
          </p>

          <h2>What it costs</h2>
          <p>
            The official protocol fee is 1%. It is set when the factory is deployed and never
            changes. Each escrow reads that fee, so the total a buyer pays and the amount a seller
            nets are known before either party signs.
          </p>

          <h2>The name</h2>
          <p>
            The Major Oak stands in Sherwood Forest near Edwinstowe. It took its present name from
            Major Hayman Rooke, an antiquarian who described the forest's oaks in the late eighteenth
            century. For centuries it was the fixed point people met at. We took the name for the
            same reason.
          </p>
          <p>
            The tree did not leaf in 2026. RSPB believes it has died and will keep it standing as a
            monument. Its acorns have grown into saplings elsewhere. We keep the name because the
            tree was a meeting place. That meaning remains.
          </p>
          <p>
            Read <Link to="/name">the lore</Link> for the hideout tale, the ballads, and the sources.
          </p>

          <h2>What it does not do</h2>
          <ul>
            <li>It does not hold your keys. You sign every transaction from your own wallet.</li>
            <li>
              It does not make the chain private. Robinhood Chain is public. Anyone can see the deal,
              the addresses, and the amounts. A restricted payer limits who may settle. Anyone can
              still see the deal.
            </li>
            <li>
              It does not vouch for a token or its issuer. Anyone can create a token with any name or
              symbol.
            </li>
            <li>
              It does not reverse a mistake. A transfer to a wrong address cannot be undone.
            </li>
          </ul>

          <h2>How to check us</h2>
          <p>
            Read the source at the commit that produced the deployed bytecode.
          </p>
          <ul>
            <li>
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                The repository
              </a>
            </li>
          </ul>

          <p>
            Read the <Link to="/terms">terms</Link> and the <Link to="/privacy">privacy note</Link>{" "}
            before you use the app.
          </p>
        </div>

        <div className="closing bare">
          <div className="hero-actions">
            <AppLink className="btn primary lg">Open the app</AppLink>
            <Link className="btn ghost lg" to="/market">
              See open deals
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
