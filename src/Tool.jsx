import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from './Layout.jsx'

// TODO: point at the hosted tool-rental subgraph once it's deployed.
// Until then, /tools/<cardKeyHash> will surface the "couldn't load" state.
const SUBGRAPH_URL = 'http://localhost:8000/subgraphs/name/tool-rental/tool-rental'
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/'

const QUERY = `
  query ToolByCardKeyHash($cardKeyHash: Bytes!) {
    tools(where: { cardKeyHash: $cardKeyHash }, first: 1) {
      id
      owner
      metadataUri
      metadata { name description image }
      listing { active minimumFee dailyRate borrowerDeposit }
    }
  }
`

function resolveIpfs(uri) {
  if (!uri) return null
  if (uri.startsWith('ipfs://')) return IPFS_GATEWAY + uri.slice('ipfs://'.length)
  return uri
}

function truncateAddr(addr) {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatUsdc(raw) {
  if (raw == null) return null
  try {
    const n = Number(BigInt(raw)) / 1e6
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } catch {
    return null
  }
}

export default function Tool() {
  const { cardKeyHash } = useParams()
  const valid = typeof cardKeyHash === 'string' && /^[0-9a-f]{64}$/.test(cardKeyHash)
  const cardKeyHashArg = valid ? '0x' + cardKeyHash : null

  const [state, setState] = useState({ status: valid ? 'loading' : 'invalid', tool: null, error: null })

  useEffect(() => {
    if (!valid) return
    let cancelled = false
    setState({ status: 'loading', tool: null, error: null })
    fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { cardKeyHash: cardKeyHashArg } }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`subgraph responded ${res.status}`)
        const body = await res.json()
        if (body.errors?.length) throw new Error(body.errors[0].message)
        return body.data?.tools?.[0] ?? null
      })
      .then((tool) => {
        if (cancelled) return
        setState({ status: tool ? 'found' : 'unregistered', tool, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ status: 'error', tool: null, error: err.message })
      })
    return () => { cancelled = true }
  }, [valid, cardKeyHashArg])

  return (
    <Layout page="tool">
      <main id="top">
        <section className="hero hero-compact">
          <p className="eyebrow">// tool rental · nfc card</p>
          <ToolBody state={state} cardKeyHash={cardKeyHash} valid={valid} />
        </section>
      </main>
    </Layout>
  )
}

function ToolBody({ state, cardKeyHash, valid }) {
  if (!valid) {
    return (
      <>
        <h1>not a valid tool card.<br/><span className="accent">check the link.</span></h1>
        <p className="lede">
          This URL doesn't look like a tool card identifier. Expected 64 lowercase
          hex characters after <code>/tools/</code>.
        </p>
      </>
    )
  }

  if (state.status === 'loading') {
    return (
      <>
        <h1>loading tool…</h1>
        <p className="lede">Looking up this card on the subgraph.</p>
      </>
    )
  }

  if (state.status === 'error') {
    return (
      <>
        <h1>couldn't load this tool.</h1>
        <p className="lede">The subgraph didn't respond. Try again in a moment.</p>
        <p className="section-footnote"><code>{state.error}</code></p>
        <DeepLinkAndStores cardKeyHash={cardKeyHash} />
      </>
    )
  }

  if (state.status === 'unregistered') {
    return (
      <>
        <h1>card not registered yet.<br/><span className="accent">no tool bound.</span></h1>
        <p className="lede">
          This card is valid but no tool has been minted against it yet. If you're
          the owner, finish provisioning in the Tool Rental app.
        </p>
        <DeepLinkAndStores cardKeyHash={cardKeyHash} />
      </>
    )
  }

  const { tool } = state
  const name = tool.metadata?.name || `Tool #${tool.id}`
  const image = resolveIpfs(tool.metadata?.image)
  const description = tool.metadata?.description
  const listing = tool.listing
  const dailyRate = listing?.active ? formatUsdc(listing.dailyRate) : null

  return (
    <>
      <h1>{name}</h1>
      <article className="card card-long tool-card">
        <div className="tool-image">
          {image ? (
            <img src={image} alt={name} />
          ) : (
            <div className="tool-image-placeholder">◆</div>
          )}
        </div>

        {description && <p>{description}</p>}

        <p className="card-stack">
          owner · <code>{truncateAddr(tool.owner)}</code>
        </p>

        <p className="tool-listing">
          {listing?.active ? (
            <>
              <strong className="accent">Available to rent</strong>
              {dailyRate && <> · {dailyRate} USDC / day</>}
            </>
          ) : (
            <strong>Not currently listed.</strong>
          )}
        </p>

        <DeepLinkAndStores cardKeyHash={cardKeyHash} />
      </article>
    </>
  )
}

function DeepLinkAndStores({ cardKeyHash }) {
  const appUrl = `toolrental://card/${cardKeyHash}`
  return (
    <>
      <div className="hero-cta">
        <a href={appUrl} className="btn btn-primary">open in Tool Rental app →</a>
      </div>
      <div className="store-badges">
        <a href="#" className="store-badge" aria-disabled="true">Get it on Google Play</a>
        <a href="#" className="store-badge" aria-disabled="true">Download on the App Store</a>
      </div>
    </>
  )
}
