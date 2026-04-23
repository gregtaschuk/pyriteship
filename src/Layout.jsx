import { Outlet, useLocation } from 'react-router-dom'
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

export default function Layout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/' || pathname === ''
  const isProjects = pathname === '/projects'
  return (
    <>
      <PyriteBackground />
      <header className="nav">
        <a href="#/" className="brand" onClick={scrollToId('top')}>
          <span className="brand-mark">◆</span>
          <span className="brand-name">pyrite</span><span className="brand-rest">.rocks</span>
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
              <a href="#/projects" aria-current={isProjects ? 'page' : undefined}>projects</a>
              <a href="mailto:greg@pyrite.rocks" className="cta">gm →</a>
            </>
          )}
        </nav>
      </header>

      <Outlet />

      <footer>
        <span>◆ pyrite consulting llc · {new Date().getFullYear()}</span>
        <span className="footer-tag">seattle / remote / worldwide</span>
      </footer>
    </>
  )
}
