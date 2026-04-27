import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const SUBGRAPH_URL =
  import.meta.env.VITE_SUBGRAPH_URL ||
  'https://api.studio.thegraph.com/query/1748423/tool-rental/v0.0.1'
const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://pyrite.mypinata.cloud'

const QUERY = `
  query ToolByCardKeyHash($cardKeyHash: Bytes!) {
    tools(where: { cardKeyHash: $cardKeyHash }, first: 1) {
      id
      owner
      cardKeyHash
      metadataUri
      metadata { name description image }
      offer {
        active
        nonce
        lender
        metadata {
          id
          minimumFee
          dailyRate
          borrowerDeposit
          gracePeriod
          signature
          lender
          borrower
        }
      }
    }
  }
`

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

function resolveIpfs(uri) {
  if (!uri) return null
  if (uri.startsWith('ipfs://')) return `${IPFS_GATEWAY}/ipfs/${uri.slice('ipfs://'.length)}`
  return uri
}

// `?o=<value>` carries either a legacy IPFS CID or, in the current flow, a
// base64url-encoded `{...offer, signature}` blob. Inline payloads are always
// far longer than 64 chars; CIDs start with `Qm` (v0) or `bafy` (v1).
function looksLikeIpfsCid(value) {
  if (!value || value.length > 64) return false
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(value) || /^bafy[A-Za-z0-9]+$/.test(value)
}

function decodeOfferFromLink(encoded) {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padLen = (4 - (padded.length % 4)) % 4
    const standard = padded + '='.repeat(padLen)
    const json = decodeURIComponent(escape(atob(standard)))
    const obj = JSON.parse(json)
    if (typeof obj?.signature !== 'string' || typeof obj?.tokenId !== 'string') return null
    return obj
  } catch {
    return null
  }
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

function gracePeriodLabel(seconds) {
  if (seconds == null) return null
  const days = Number(seconds) / 86400
  if (!Number.isFinite(days)) return null
  if (days >= 1) {
    const rounded = Math.round(days * 10) / 10
    return `${rounded} day${rounded === 1 ? '' : 's'}`
  }
  const hours = Math.round((Number(seconds) / 3600) * 10) / 10
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

export default function Tool() {
  const { cardKeyHash } = useParams()
  const [searchParams] = useSearchParams()
  const offerParam = searchParams.get('o')

  const valid = typeof cardKeyHash === 'string' && /^[0-9a-f]{64}$/.test(cardKeyHash)
  const cardKeyHashArg = valid ? '0x' + cardKeyHash : null

  const [state, setState] = useState({ status: valid ? 'loading' : 'invalid', tool: null, error: null })
  const [linkedOffer, setLinkedOffer] = useState({ status: 'idle', data: null, error: null })

  // Subgraph fetch — gets tool name + current offer terms.
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

  // Optional ?o=<value> resolution — when a lender shares a link to a
  // specific signed offer, render those exact terms even if the subgraph
  // hasn't indexed them (or if the lender has since rotated the nonce).
  // The value is either a legacy IPFS CID (fetched) or an inline base64url-
  // encoded offer (decoded synchronously, no network).
  useEffect(() => {
    if (!offerParam) {
      setLinkedOffer({ status: 'idle', data: null, error: null })
      return
    }
    if (!looksLikeIpfsCid(offerParam)) {
      const decoded = decodeOfferFromLink(offerParam)
      if (decoded) {
        setLinkedOffer({ status: 'loaded', data: decoded, error: null })
      } else {
        setLinkedOffer({ status: 'error', data: null, error: 'invalid shared offer' })
      }
      return
    }
    let cancelled = false
    setLinkedOffer({ status: 'loading', data: null, error: null })
    fetch(`${IPFS_GATEWAY}/ipfs/${offerParam}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`ipfs gateway responded ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        setLinkedOffer({ status: 'loaded', data, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setLinkedOffer({ status: 'error', data: null, error: err.message })
      })
    return () => { cancelled = true }
  }, [offerParam])

  return (
    <main id="top">
      <section className="hero hero-compact">
        <p className="eyebrow">// tool rental · nfc card</p>
        <ToolBody
          state={state}
          linkedOffer={linkedOffer}
          cardKeyHash={cardKeyHash}
          offerParam={offerParam}
          valid={valid}
        />
      </section>
    </main>
  )
}

function ToolBody({ state, linkedOffer, cardKeyHash, offerParam, valid }) {
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
        <DeepLinkAndStores cardKeyHash={cardKeyHash} offerParam={offerParam} />
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
        <DeepLinkAndStores cardKeyHash={cardKeyHash} offerParam={offerParam} />
      </>
    )
  }

  const { tool } = state
  const name = tool.metadata?.name || `Tool #${tool.id}`
  const image = resolveIpfs(tool.metadata?.image)
  const description = tool.metadata?.description

  // Effective offer: prefer the linked ?o=<cid> payload when it loads, fall
  // back to the subgraph's current offer. The linked offer survives nonce
  // rotation; the subgraph offer reflects whatever the lender most recently
  // published.
  const subgraphOfferActive = tool.offer?.active === true
  const subgraphOffer = subgraphOfferActive ? tool.offer?.metadata : null
  const linkedOfferData = linkedOffer.status === 'loaded' ? linkedOffer.data : null

  // Validate that a linked offer matches this card's tool — if it doesn't,
  // ignore it and fall back to the subgraph offer with a warning.
  const linkedTokenMismatch = linkedOfferData
    && linkedOfferData.tokenId != null
    && String(linkedOfferData.tokenId) !== String(tool.id)
  const usableLinkedOffer = linkedOfferData && !linkedTokenMismatch ? linkedOfferData : null

  const effectiveOffer = usableLinkedOffer ?? subgraphOffer
  const offerSource = usableLinkedOffer ? 'link' : (subgraphOffer ? 'current' : null)

  const minimumFee = formatUsdc(effectiveOffer?.minimumFee)
  const dailyRate = formatUsdc(effectiveOffer?.dailyRate)
  const deposit = formatUsdc(effectiveOffer?.borrowerDeposit)
  const grace = gracePeriodLabel(effectiveOffer?.gracePeriod)
  const targetedBorrower = effectiveOffer?.borrower && effectiveOffer.borrower !== ZERO_ADDRESS
    ? effectiveOffer.borrower
    : null

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

        {effectiveOffer ? (
          <>
            <p className="tool-listing">
              <strong className="accent">
                {offerSource === 'link' ? 'Shared offer' : 'Available to rent'}
              </strong>
              {dailyRate && <> · {dailyRate} USDC / day</>}
            </p>
            <ul className="card-stack tool-terms">
              {minimumFee && <li>minimum fee · <strong>{minimumFee} USDC</strong></li>}
              {dailyRate && <li>daily rate · <strong>{dailyRate} USDC</strong></li>}
              {deposit && <li>refundable deposit · <strong>{deposit} USDC</strong></li>}
              {grace && <li>grace period · <strong>{grace}</strong></li>}
              {targetedBorrower && (
                <li>private offer for · <code>{truncateAddr(targetedBorrower)}</code></li>
              )}
            </ul>
          </>
        ) : (
          <p className="tool-listing"><strong>Not currently listed.</strong></p>
        )}

        {linkedTokenMismatch && (
          <p className="section-footnote">
            ⚠ shared link's offer doesn't match this card — showing this card's
            current offer instead.
          </p>
        )}
        {linkedOffer.status === 'loading' && (
          <p className="section-footnote">loading shared offer from IPFS…</p>
        )}
        {linkedOffer.status === 'error' && (
          <p className="section-footnote">
            couldn't load shared offer · <code>{linkedOffer.error}</code>
          </p>
        )}

        <DeepLinkAndStores cardKeyHash={cardKeyHash} offerParam={offerParam} />
      </article>
    </>
  )
}

function DeepLinkAndStores({ cardKeyHash, offerParam }) {
  const suffix = offerParam ? `?o=${offerParam}` : ''
  const appUrl = `toolrental://card/${cardKeyHash}${suffix}`
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
