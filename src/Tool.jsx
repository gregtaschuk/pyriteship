import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from './Layout.jsx'

const SUBGRAPH_URL = 'http://localhost:8000/subgraphs/name/tool-rental/tool-rental'
const IPFS_GATEWAY = 'http://localhost:8080/ipfs/'

const QUERY = `
  query ToolByCardKey($x: Bytes!, $y: Bytes!) {
    tools(where: { cardKeyX: $x, cardKeyY: $y }, first: 1) {
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
  const { hex } = useParams()
  const valid = typeof hex === 'string' && /^[0-9a-f]{128}$/.test(hex)
  const cardKeyX = valid ? '0x' + hex.slice(0, 64) : null
  const cardKeyY = valid ? '0x' + hex.slice(64) : null

  const [state, setState] = useState({ status: valid ? 'loading' : 'invalid', tool: null, error: null })

  useEffect(() => {
    if (!valid) return
    let cancelled = false
    setState({ status: 'loading', tool: null, error: null })
    fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { x: cardKeyX, y: cardKeyY } }),
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
  }, [valid, cardKeyX, cardKeyY])

  return (
    <Layout page="tool">
      <main id="top">
        <section className="hero hero-compact">
          <p className="eyebrow">// tool rental · nfc card</p>
          <ToolBody state={state} hex={hex} valid={valid} />
        </section>
      </main>
    </Layout>
  )
}

function ToolBody({ state, hex, valid }) {
  if (!valid) {
    return (
      <>
        <h1>not a valid tool card.<br/><span className="accent">check the link.</span></h1>
        <p className="lede">
          This URL doesn't look like a tool card identifier. Expected 128 lowercase
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
      </>
    )
  }

  const { tool } = state
  const name = tool.metadata?.name || `Tool #${tool.id}`
  const image = resolveIpfs(tool.metadata?.image)
  const description = tool.metadata?.description
  const listing = tool.listing
  const dailyRate = listing?.active ? formatUsdc(listing.dailyRate) : null
  const appUrl = `toolrental://card/${hex}`

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

        <div className="hero-cta">
          <a href={appUrl} className="btn btn-primary">open in Tool Rental app →</a>
        </div>

        <div className="store-badges">
          <a href="#" className="store-badge" aria-disabled="true">Get it on Google Play</a>
          <a href="#" className="store-badge" aria-disabled="true">Download on the App Store</a>
        </div>
      </article>
    </>
  )
}
