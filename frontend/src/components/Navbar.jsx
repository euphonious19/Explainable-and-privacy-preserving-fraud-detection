import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/analyze', label: 'Analyze' },
  { to: '/alerts', label: 'Alert Queue' },
  { to: '/metrics', label: 'Metrics' },
]

export default function Navbar() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🛡️</span>
          <span style={styles.logoText}>Fraud<span style={styles.logoAccent}>Shield</span></span>
        </Link>

        {/* Desktop links */}
        <ul style={styles.links}>
          {NAV_LINKS.map(link => (
            <li key={link.to}>
              <Link
                to={link.to}
                style={{
                  ...styles.link,
                  ...(location.pathname === link.to ? styles.linkActive : {}),
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link to="/analyze" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Analyze Transaction</span>
          <span>→</span>
        </Link>

        {/* Hamburger */}
        <button
          style={styles.hamburger}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span style={{ fontSize: '1.3rem' }}>{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={styles.mobileMenu}>
          {NAV_LINKS.map(link => (
            <Link
              key={link.to}
              to={link.to}
              style={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/analyze" className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setMenuOpen(false)}>
            Analyze Transaction
          </Link>
        </div>
      )}
    </nav>
  )
}

const styles = {
  nav: {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    background: 'rgba(6, 7, 13, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    height: 72,
  },
  inner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 32,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    textDecoration: 'none',
    marginRight: 'auto',
  },
  logoIcon: { fontSize: '1.4rem' },
  logoText: {
    fontSize: '1.15rem',
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: '-0.02em',
  },
  logoAccent: { color: '#818cf8' },
  links: {
    display: 'flex',
    listStyle: 'none',
    gap: 4,
  },
  link: {
    display: 'block',
    padding: '8px 14px',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#94a3b8',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'color 0.15s, background 0.15s',
  },
  linkActive: {
    color: '#f1f5f9',
    background: 'rgba(255,255,255,0.06)',
  },
  hamburger: {
    display: 'none',
    background: 'none',
    border: 'none',
    color: '#f1f5f9',
    cursor: 'pointer',
    padding: '8px',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 24px 24px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    gap: 4,
  },
  mobileLink: {
    display: 'block',
    padding: '12px 16px',
    borderRadius: 8,
    textDecoration: 'none',
    color: '#94a3b8',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
}
