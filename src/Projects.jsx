export default function Projects() {
  return (
    <main id="top">
        <section className="hero hero-compact">
          <p className="eyebrow">// selected work</p>
          <h1>
            projects.<br/>
            <span className="accent">things I've built,</span><br/>
            <span className="accent"><span className="heroEmphasis">how</span> and why.</span>
          </h1>
          <p className="lede">
            Three projects that show how I think about protocol design, smart contract
            authorship, and shipping onchain systems end-to-end.
          </p>
        </section>

        <section className="section">
          <article className="card card-long">
            <span className="card-tag">poc</span>
            <h3>Tool Library — hardware-bound NFC rental escrow</h3>
            <p className="card-stack">solidity · base l2 · java card · react native · the graph</p>
            <p>
              A personal proof-of-concept side project exploring what happens when you
              bind a physical object to an onchain identity through a tamper-resistant
              secure element. A peer-to-peer physical tool rental platform where every tool carries a
              hardware NFC JavaCard acting as its cryptographic identity. Handoffs
              between lender and borrower are proven by physically tapping the card:
              it signs a fresh challenge with an on-card P-256 key that never leaves
              the secure element, and <code>RentalEscrow.sol</code> verifies the
              signature onchain before any collateral moves.
            </p>
            <p>
              <strong>Design.</strong> A Java Card applet on J3R180 / JCOP4 hardware
              exposes a handful of ISO 7816 APDUs — read public key, sign hash,
              return counter, return rental id — using the card's native P-256
              accelerator. An ERC-721 / ERC-4907{' '}
              <code>ToolNFT</code> immutably binds each physical tool to its card's
              public key at mint time. On Base, P-256 verification lands through the
              EIP-7212 precompile (~3.4k gas) instead of a ~200k-gas pure-Solidity
              fallback, which is what makes the whole model viable onchain.
              Challenges are committed onchain with a 5-minute TTL — no backend,
              and the block timestamp is a stronger freshness witness than any
              off-chain cache. Every signature is EIP-712 typed data binding tool
              or rental id, phase (<code>start</code> vs <code>end</code>), chain
              id, and escrow address, so phases can't be confused or replayed.
              Settlement is pull-based via <code>withdrawTokens()</code> to shrink
              the reentrancy surface and handle edge cases cleanly — mutual consent
              returns, lost-card replacement, default.
            </p>
            <p>
              <strong>Listings.</strong> Off-chain signed offers. A lender signs an
              EIP-712 <code>RentalOffer</code> struct with their wallet, pins the{' '}
              <code>{'{ offer, signature }'}</code> JSON to IPFS, and the escrow
              records only the CID onchain (~30–50k gas vs a full storage write).
              The same signed offer serves unlimited rentals until the lender
              rotates the nonce; a single <code>delistTool</code> call invalidates
              everything outstanding. Offers can also be targeted to a specific
              borrower for share-a-link private rentals.
            </p>
            <p>
              <strong>Live on Base Sepolia.</strong>{' '}
              <code>ToolNFT</code> at{' '}
              <a
                href="https://sepolia.basescan.org/address/0xFbf20Ea82711E21862803aD79e38fB98F2B3a1bD"
                target="_blank"
                rel="noreferrer"
              >
                <code>0xFbf2…a1bD</code>
              </a>
              , <code>RentalEscrow</code> at{' '}
              <a
                href="https://sepolia.basescan.org/address/0xE82886e55Fd866B1425D15039C27a253c891954c"
                target="_blank"
                rel="noreferrer"
              >
                <code>0xE828…954c</code>
              </a>
              . Collection browsable on{' '}
              <a
                href="https://testnets.opensea.io/assets/base-sepolia/0xFbf20Ea82711E21862803aD79e38fB98F2B3a1bD"
                target="_blank"
                rel="noreferrer"
              >
                OpenSea
              </a>
              .
            </p>
            <p className="card-role">
              <strong>My role.</strong> Designed with Claude, end-to-end. Protocol design,
              Solidity (Foundry + Hardhat), NFC Java Card applet, a
              provisioner CLI that flashes blank cards over USB NFC via GlobalPlatform
              and mints the matching NFT, a The Graph subgraph,
              and a React Native mobile client.
            </p>
          </article>
        </section>

        <section className="section section-alt">
          <article className="card card-long">
            <span className="card-tag">stablecoin</span>
            <h3>Fidelity Digital Dollar — <code>MintableToken</code></h3>
            <p className="card-stack">solidity · openzeppelin upgradeable · fidelity digital assets</p>
            <p>
              <code>MintableToken</code> is the ERC-20 contract underpinning the
              Fidelity Digital Dollar (FIDD), Fidelity's institutional stablecoin.
              It's open-sourced at{' '}
              <a
                href="https://github.com/fidelity/mintable-token-ethereum-contract"
                target="_blank"
                rel="noreferrer"
              >
                fidelity/mintable-token-ethereum-contract
              </a>.
            </p>
            <p>
              <strong>Design.</strong> A UUPS-upgradeable, role-gated ERC-20 built on
              OpenZeppelin's upgradeable stack. Mint allocation, transfer restrictions,
              and upgrade authorization are separated into distinct modules so that
              issuance, compliance, and governance functions can be held by different
              keys. </p>
            <p>
              <strong>How Fidelity launched it.</strong> Issued onchain by Fidelity
              Digital Assets as part of the firm's broader institutional digital-asset
              program, sitting alongside Fidelity's existing custody and execution
              infrastructure. The contract is the settlement primitive the Fidelity Digital
              Dollar program uses onchain.
            </p>
            <p>
              <strong>Adoption.</strong> FIDD is live on Ethereum mainnet at{' '}
              <a
                href="https://etherscan.io/token/0x7c135549504245b5eae64fc0e99fa5ebabb8e35d"
                target="_blank"
                rel="noreferrer"
              >
                <code>0x7c13…e35d</code>
              </a>{' '}
              with roughly $50M in circulating supply, holding its peg at ~$1.00.
              It trades on centralized venues including Bullish (primary liquidity)
              and Kraken, and onchain on Uniswap V3 and Curve — relatively rare for
              an institutionally-issued stablecoin, and a signal that Fidelity is
              treating FIDD as a real settlement asset rather than a closed-loop
              internal token.{' '}
              <a href="https://www.coingecko.com/en/coins/fidelity-digital-dollar" target="_blank" rel="noreferrer">Tracked on CoinGecko</a>.
            </p>
            <p className="card-role">
              <strong>My role.</strong> Technical Architect on the Digital Dollar
              program at Fidelity. Authored the <code>MintableToken</code> contract
              as it's deployed today, and designed the surrounding reserve,
              settlement, and integration surface between Fidelity's institutional
              systems and public chains.
            </p>
          </article>
        </section>

        <section className="section">
          <article className="card card-long">
            <span className="card-tag">amm</span>
            <h3>Balancer V2 — the Vault</h3>
            <p className="card-stack">solidity · balancer labs · ethereum mainnet</p>
            <p>
              Balancer V2 replaced a pool-is-a-contract model with a single central{' '}
              <code>Vault</code> that holds all token balances for every pool in the
              system. Pools became logic contracts that the Vault calls into for
              pricing; the Vault owns custody and accounting. It's one of the
              most-forked AMM designs in DeFi.
            </p>
            <p>
              <strong>Design.</strong> A single Vault as the custody and accounting
              layer for the whole protocol. Pool contracts as pluggable math —
              weighted, stable, and fully custom pool types — queried by the Vault
              during swaps. A batched multi-hop swap engine that only touches any
              given token balance once per batch, collapsing what used to be N
              transfers across N pool contracts into a single netted settlement.
              An internal balance system so repeat users can skip ERC-20 transfers
              entirely. Flash loans as a free side effect of that accounting model.
              A permissioned pool factory that decouples pool deployment from core
              upgrades, so new pool types could ship without touching the Vault.
            </p>
            <p>
              <strong>Adoption.</strong> Balancer V2 shipped in May 2021 and has
              been one of the larger AMMs in DeFi ever since, holding hundreds of
              millions to low billions of dollars in TVL across Ethereum and every
              major L2 (Arbitrum, Optimism, Base, Polygon, Gnosis Chain, Avalanche,
              zkEVM). The Vault architecture is the reference design that Beethoven X
              (Fantom / Optimism / Sonic) forked wholesale, and it's the substrate
              that CoW Protocol, Aura Finance, Gyroscope, Xave, and dozens of other
              projects build on top of — their pools plug directly into the Vault
              rather than standing up their own AMMs. Integrations I worked on
              include Aave's Boosted Pools (idle liquidity earning yield in Aave
              while still being tradeable), Gnosis Protocol / CoW Swap as an
              execution venue, and 1inch / Paraswap / 0x as routing aggregators.
            </p>
            <p className="card-role">
              <strong>My role.</strong> Core team at Balancer Labs. I wrote the
              initial Vault implementation as part of the team that shipped v2 —
              it was a team effort, but a lot of the first-draft Vault code is mine.
              Later moved into the Integrations group, working with partner protocols,
              aggregators, and teams building custom pool types on top of the Vault.
            </p>
          </article>
        </section>

        <section className="section section-alt">
          <h2>// get in touch</h2>
          <p className="contact-lede">
            If you want something like one of these built — or audited, or rescued —
            email is best.
          </p>
          <a className="email-link" href="mailto:greg@pyrite.rocks">
            → greg@pyrite.rocks
          </a>
        </section>
      </main>
  )
}
