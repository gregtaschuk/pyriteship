import PyriteBackground from './PyriteBackground.jsx'

function scrollToId(id) {
  return (e) => {
    const el = document.getElementById(id)
    if (el) {
      e.preventDefault()
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}

export default function Layout({ page, children }) {
  const isHome = page === 'home'
  return (
    <>
      <PyriteBackground />
      <header className="nav">
        <a href="#/" className="brand" onClick={scrollToId('top')}>
          <span className="brand-mark">◆</span>
          <span className="brand-name">pyrite</span><span className="brand-rest">ship.xyz</span>
        </a>
        <nav>
          {isHome ? (
            <>
              <a href="#/" onClick={scrollToId('work')}>work</a>
              <a href="#/projects">projects</a>
              <a href="#/" onClick={scrollToId('experience')}>experience</a>
              <a href="#/" onClick={scrollToId('contact')} className="cta">gm →</a>
            </>
          ) : (
            <>
              <a href="#/">home</a>
              <a href="#/projects" aria-current="page">projects</a>
              <a href="mailto:greg@pyriteship.xyz" className="cta">gm →</a>
            </>
          )}
        </nav>
      </header>

      {children}

      <footer>
        <span>◆ pyrite consulting llc · {new Date().getFullYear()}</span>
        <span className="footer-tag">seattle / remote / worldwide</span>
      </footer>
    </>
  )
}
