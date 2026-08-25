export function PrivacyPage() {
  return (
    <main className="page shell" id="main">
      <div className="page-column prose">
        <div className="page-head">
          <h1 className="page-title">Privacy</h1>
          <p className="page-sub label">Last updated 13 August 2026</p>
        </div>

        <div className="prose">
        <h2>1. The short version</h2>
        <p>
          MajorOak has no accounts, no sign-ups, and no database of users. We do not collect your
          name, email, or any personal information. Your wallet connects directly from your
          browser to the blockchain.
        </p>

        <h2>2. What is public by design</h2>
        <p>
          Everything you do through the Protocol lives on a public blockchain. Your wallet
          address, deal terms, and transaction history are permanently visible to anyone,
          including through this Interface. That is how blockchains work; MajorOak does not
          control it and cannot delete it.
        </p>

        <h2>3. What your browser shares</h2>
        <p>
          When you use the Interface, your browser talks directly to third-party services: the
          Robinhood Chain RPC endpoint to read and send transactions, and Dexscreener and
          GeckoTerminal to fetch token logos, prices, and charts. Those services see your IP
          address and the addresses you look up, under their own privacy policies. MajorOak does
          not run analytics, tracking pixels, or advertising, and does not sell data to anyone.
        </p>

        <h2>4. Local storage</h2>
        <p>
          The Interface stores small preferences (such as your wallet connection state) in your
          own browser. Clearing your browser data removes them. Nothing is stored on MajorOak
          servers.
        </p>

        <h2>5. Your wallet is yours</h2>
        <p>
          MajorOak never has access to your private keys or seed phrase. We will never ask for
          them. Treat any such request as a theft attempt.
        </p>

        <h2>6. Changes</h2>
        <p>
          If this policy changes, the new version will be posted here with an updated date.
        </p>
        </div>
      </div>
    </main>
  );
}
