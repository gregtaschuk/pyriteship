import { useParams, useSearchParams } from 'react-router-dom'

// NTAG 424 DNA tags emit an SDM URL of the form
//   https://pyrite.rocks/tag?picc=<32 hex>&cmac=<16 hex>
// where `picc` is the encrypted PICCData and `cmac` is the truncated SDM MAC.
// This site holds NO key material — only the lender's app holds the per-tool
// key — so we cannot cryptographically verify the tag here, by design. This
// page just confirms the URL is a genuine-format Tool Rental tag and points
// the visitor at the app to actually rent or verify it.

const PICC_RE = /^[0-9a-fA-F]{32}$/
const CMAC_RE = /^[0-9a-fA-F]{16}$/

export default function Tag() {
  const { uid } = useParams()
  const [searchParams] = useSearchParams()
  const picc = searchParams.get('picc')
  const cmac = searchParams.get('cmac')

  const hasParams = uid != null || picc != null || cmac != null
  const wellFormed = PICC_RE.test(picc || '') && CMAC_RE.test(cmac || '')

  return (
    <main id="top">
      <section className="hero hero-compact">
        <p className="eyebrow">// tool rental · nfc tag</p>
        <TagBody uid={uid} hasParams={hasParams} wellFormed={wellFormed} />
      </section>
    </main>
  )
}

function TagBody({ uid, hasParams, wellFormed }) {
  if (!hasParams) {
    return (
      <>
        <h1>Tool Rental tag.<br/><span className="accent">tap it with the app.</span></h1>
        <p className="lede">
          This is the landing page for Tool Rental NFC tags. A genuine tag tap
          opens this page with a one-time secure code. Open the Tool Rental app
          and tap the tag to rent the tool or check its listing.
        </p>
        <TagStores />
      </>
    )
  }

  return (
    <>
      <h1>Tool Rental tag.<br/><span className="accent">open the app to rent.</span></h1>
      <article className="card card-long tool-card">
        <div className="tool-image">
          <div className="tool-image-placeholder">◆</div>
        </div>
        {uid && (
          <p className="tool-listing">
            <span className="monospace accent">{uid}</span>
          </p>
        )}
        <p>
          This is a Tool Rental NFC tag — the tap above carried a one-time
          secure code{wellFormed ? '' : ', though it looks incomplete'}.
        </p>
        <p className="tool-listing">
          <strong className="accent">Genuine-format tag.</strong>
        </p>
        <p className="card-stack">
          Authenticity is verified inside the app, not on this page — only the
          tool's lender holds the key that proves a tag is real, so we can't
          check it here. Open the Tool Rental app and tap the tag to view the
          listing and rent.
        </p>
        <TagStores />
      </article>
    </>
  )
}

function TagStores() {
  return (
    <>
      <div className="hero-cta">
        <a href="toolrental://" className="btn btn-primary">open in Tool Rental app →</a>
      </div>
      <div className="store-badges">
        <a href="#" className="store-badge" aria-disabled="true">Get it on Google Play</a>
        <a href="#" className="store-badge" aria-disabled="true">Download on the App Store</a>
      </div>
    </>
  )
}
