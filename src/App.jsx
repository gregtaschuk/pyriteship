import PyriteBackground from './PyriteBackground.jsx'

export default function App() {
  return (
    <>
      <PyriteBackground />
      <header className="nav">
        <a href="#top" className="brand">
          <span className="brand-mark">◆</span>
          <span className="brand-name">pyrite</span><span className="brand-rest">ship.xyz</span>
        </a>
        <nav>
          <a href="#work">work</a>
          <a href="#for">who</a>
          <a href="#experience">experience</a>
          <a href="#contact" className="cta">gm →</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <p className="eyebrow">// blockchain architecture · rapid shipping</p>
          <h1>
            pyrite consulting.<br/>
            <span className="accent">blockchain architecture for teams who <span className="ship">ship</span>.</span>
          </h1>
          <p className="lede">
            Pyrite is Greg Taschuk's consultancy. Architecture, smart contracts,
            backends, indexing, and the infrastructure around them.
          </p>
          <div className="hero-cta">
            <a href="#contact" className="btn btn-primary">get in touch</a>
            <a href="#work" className="btn btn-ghost">what I do →</a>
          </div>
        </section>

        <section id="work" className="section">
          <h2>// work</h2>
          <div className="grid">
            <Card
              tag="arch"
              title="Protocol & System Design"
              body="EVM, L2s, app-chains, rollups. Custody, settlement, tokenization, cross-chain."
            />
            <Card
              tag="impl"
              title="Smart Contracts & Backends"
              body="Solidity, Foundry, indexers, keepers, relayers, RPC infra."
            />
            <Card
              tag="stbl"
              title="Stablecoins & Payments Rails"
              body="Issuance, reserves, attestation, on/off-ramps, compliance touchpoints."
            />
            <Card
              tag="ddil"
              title="Technical Due Diligence"
              body="Independent review of a protocol, vendor, or codebase. Written findings."
            />
            <Card
              tag="cto"
              title="Fractional CTO / Advisory"
              body="Embedded with early-stage teams. Architecture, hiring, scope. A few hours a week."
            />
            <Card
              tag="xfer"
              title="TradFi → Onchain Translation"
              body="Mental models and vocabulary for institutional teams working with crypto-native ones."
            />
          </div>
        </section>

        <section id="for" className="section section-alt">
          <h2>// who this is for</h2>
          <div className="two-col">
            <div>
              <h3>tradfi going onchain</h3>
              <p>
                Banks, asset managers, and payments firms touching stablecoins,
                tokenized assets, or onchain settlement.
              </p>
            </div>
            <div>
              <h3>startups shipping v1</h3>
              <p>
                Early-stage teams shipping their first mainnet version who want an
                experienced hand on the architecture.
              </p>
            </div>
          </div>
        </section>

        <section id="experience" className="section">
          <h2>// experience</h2>
          <ul className="experience">
            <li>
              <img src="/logos/fidelity.svg" alt="" className="exp-logo" />
              <div className="exp-content">
                <div className="exp-role">Technical Architect · <a className="exp-co" href="https://www.fidelitydigitalassets.com/" target="_blank" rel="noreferrer">Fidelity Digital Assets</a></div>
                <div className="exp-body">
                  Architecture lead on the Fidelity Digital Dollar — institutional stablecoin
                  design, reserves, settlement flows, and the integration surface between
                  a Fortune 100 financial services firm and public chains. Authored the{' '}
                  <a
                    href="https://github.com/fidelity/mintable-token-ethereum-contract/blob/main/contracts/MintableToken.sol"
                    target="_blank"
                    rel="noreferrer"
                  >
                    MintableToken contract
                  </a>{' '}
                  the program uses onchain.
                </div>
              </div>
            </li>
            <li>
              <img src="/logos/balancer.svg" alt="" className="exp-logo" />
              <div className="exp-content">
                <div className="exp-role">Integrations Engineer · <a className="exp-co" href="https://balancer.fi/" target="_blank" rel="noreferrer">Balancer</a></div>
                <div className="exp-body">
                  Core team on Balancer v2, focused on integrations. Shipped the work
                  that plugged partner protocols, aggregators, and custom pool types
                  into the Vault — interfacing with external teams building on one of the
                  most-forked AMM designs in DeFi.
                </div>
              </div>
            </li>
            <li>
              <img src="/logos/consensys.svg" alt="" className="exp-logo" />
              <div className="exp-content">
                <div className="exp-role">Blockchain Engineer · <a className="exp-co" href="https://consensys.io/" target="_blank" rel="noreferrer">ConsenSys</a></div>
                <div className="exp-body">
                  Early Ethereum ecosystem work across client tooling and production
                  dapps.
                </div>
              </div>
            </li>
          </ul>
        </section>

        <section id="about" className="section section-alt">
          <h2>// about</h2>
          <div className="about-grid">
            <img src="/headshot.jpg" alt="Greg Taschuk" className="headshot" />
            <div>
          <p className="about-body">
            Pyrite is run by <strong>Greg Taschuk</strong>. A decade of software engineering,
            most recently at Fidelity on digital assets, with prior time on stablecoin
            infrastructure and blockchain architecture. Swarthmore CS. Based in Seattle,
            works with teams anywhere.
          </p>
          <p>
            <a href="https://www.linkedin.com/in/taschuk" target="_blank" rel="noreferrer">
              linkedin ↗
            </a>
            {' · '}
            <a href="https://github.com/gtaschuk" target="_blank" rel="noreferrer">
              github/gtaschuk ↗
            </a>
            {' · '}
            <a href="https://github.com/gregtaschuk" target="_blank" rel="noreferrer">
              github/gregtaschuk ↗
            </a>
          </p>
            </div>
          </div>
        </section>

        <section id="contact" className="section">
          <h2>// contact</h2>
          <p className="contact-lede">
            Short or long engagements. Email is best.
          </p>
          <a className="email-link" href="mailto:greg@pyriteship.xyz">
            → greg@pyriteship.xyz
          </a>
        </section>
      </main>

      <footer>
        <span>◆ pyrite consulting llc · {new Date().getFullYear()}</span>
        <span className="footer-tag">seattle / remote / worldwide</span>
      </footer>
    </>
  )
}

function Card({ tag, title, body }) {
  return (
    <article className="card">
      <span className="card-tag">{tag}</span>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}
