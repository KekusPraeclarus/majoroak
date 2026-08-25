import { Link } from "react-router-dom"

import emblemMark from "../../../../docs/brand/assets/emblem-mark.svg"

export function NotFoundPage() {
  return (
    <main className="page shell" id="main">
      <div className="not-found">
        <span
          className="not-found-mark"
          style={{ ["--lockup" as string]: `url(${emblemMark})` }}
          aria-hidden="true"
        />
        <h1 className="title-section">This page is not here</h1>
        <p>Check the address. Every deal link ends with an escrow contract address.</p>
        <Link className="btn secondary" to="/">
          Go to the front page
        </Link>
      </div>
    </main>
  )
}
