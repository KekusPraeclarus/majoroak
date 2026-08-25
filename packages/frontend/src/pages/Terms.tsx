export function TermsPage() {
  return (
    <main className="page shell" id="main">
      <div className="page-column prose">
        <div className="page-head">
          <h1 className="page-title">Terms</h1>
          <p className="page-sub label">Last updated 13 August 2026</p>
        </div>

        <div className="prose">
        <h2>1. What MajorOak is</h2>
        <p>
          MajorOak ("the Interface") is a website that helps you interact with open, autonomous
          smart contracts deployed on Robinhood Chain ("the Protocol"). The Protocol escrows
          tokens for over-the-counter deals and settles them atomically. The Interface is
          non-custodial: at no point does MajorOak hold, control, or have access to your funds,
          private keys, or wallet.
        </p>

        <h2>2. No affiliation</h2>
        <p>
          MajorOak is independent software. It is not affiliated with, endorsed by, or connected
          to Robinhood Markets, Inc., Paxos, or any token project listed or tradable through the
          Protocol. Token names and logos belong to their respective projects.
        </p>

        <h2>3. Eligibility</h2>
        <p>
          You may use the Interface only if you are legally permitted to do so where you live, and
          you are solely responsible for complying with your local laws, including tax
          obligations. You may not use the Interface if you are subject to sanctions or located in
          a sanctioned jurisdiction.
        </p>

        <h2>4. Risks you accept</h2>
        <p>
          Digital assets are volatile and can lose all value. Smart contracts can contain bugs.
          Tokens listed by third parties can be worthless or malicious, including tokens that
          cannot be resold. A deal priced above or below market is your decision alone. The gold
          verification seal means MajorOak checked a token's contract address; it is not an
          endorsement, a guarantee of value, or investment advice. You accept all of these risks
          when you use the Interface.
        </p>

        <h2>5. Fees</h2>
        <p>
          The Protocol charges a 1% fee on successful settlement. That rate is fixed in the smart
          contract and displayed on every deal before you commit. Network gas fees apply to every
          transaction and are never refundable.
        </p>

        <h2>6. No advice, no warranty</h2>
        <p>
          Nothing on the Interface is financial, investment, legal, or tax advice. The Interface
          and Protocol are provided "as is" without warranty of any kind. Market data shown on the
          Interface comes from third parties and can be delayed, incomplete, or wrong.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, MajorOak and its contributors are not liable for
          any loss arising from your use of the Interface or the Protocol, including loss of
          funds, lost profits, or losses caused by smart contract failures, third-party tokens,
          phishing sites imitating MajorOak, or wallet compromise.
        </p>

        <h2>8. Prohibited use</h2>
        <p>
          You agree not to use the Interface to break the law, including money laundering,
          financing terrorism, or trading assets you do not lawfully own, and not to interfere
          with the operation of the Interface.
        </p>

        <h2>9. Changes</h2>
        <p>
          These terms may be updated at any time. Continued use of the Interface after an update
          means you accept the new terms.
        </p>
        </div>
      </div>
    </main>
  );
}
