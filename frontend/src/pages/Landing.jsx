import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const STATS = [
  { value: 1087, suffix: ' Cr', label: 'UPI Fraud in India (2023)', prefix: '₹' },
  { value: 98.5, suffix: '%', label: 'Combined Recall (FL + GNN)', prefix: '' },
  { value: 42, suffix: 'ms', label: 'Avg Detection Latency', prefix: '' },
  { value: 5, suffix: ' Banks', label: 'Federated Nodes (No Data Sharing)', prefix: '' },
]

function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(parseFloat(start.toFixed(1)))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return <span>{prefix}{count}{suffix}</span>
}

const PILLARS = [
  {
    icon: '🔒',
    title: 'Privacy Preserved',
    desc: 'Federated Learning trains across 5 simulated bank nodes. No raw transaction data ever leaves the originating institution — RBI Data Localisation compliant.',
    color: '#6366f1',
  },
  {
    icon: '🔗',
    title: 'Structural Detection',
    desc: 'GraphSAGE GNN detects money mule chains, layering patterns, and fan-in structures that tabular models completely miss.',
    color: '#10b981',
  },
  {
    icon: '🔍',
    title: 'Full Explainability',
    desc: 'Every decision backed by SHAP feature importance + LIME instance explanation + interactive subgraph visualization. Regulator-ready audit trail.',
    color: '#f59e0b',
  },
]

const REAL_WORLD = [
  { bank: 'HDFC Bank', issue: 'Cannot share customer data with other banks for joint fraud detection', solution: 'FraudShield FL: each bank trains locally, shares only model weights' },
  { bank: 'NPCI (UPI)', issue: 'Mule accounts used to siphon funds across 5–6 hops in seconds', solution: 'GraphSAGE GNN detects fan-in/fan-out patterns before settlement' },
  { bank: 'RBI Compliance', issue: 'Black-box AI models cannot explain fraud blocks to regulators', solution: 'SHAP + LIME provide auditable, human-readable explanations per transaction' },
  { bank: 'SBI / PNB', issue: 'Centralised fraud models require all customer data in one place', solution: 'Federated architecture: no centralised data lake required' },
]

export default function Landing() {
  return (
    <div>
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={heroStyle}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div className="badge badge-blue fade-in-up" style={{ marginBottom: 24, display: 'inline-flex' }}>
            🏛️ RBI Compliant &nbsp;·&nbsp; Privacy-First
          </div>

          <h1 className="fade-in-up-1" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
            Federated Fraud Detection<br />
            <span className="gradient-text">With Graph Intelligence</span>
          </h1>

          <p className="fade-in-up-2" style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto 36px', lineHeight: 1.7 }}>
            FraudShield combines <strong style={{ color: '#818cf8' }}>Federated Learning</strong> for privacy-preserving tabular detection
            with <strong style={{ color: '#10b981' }}>GraphSAGE GNN</strong> for structural mule chain detection —
            integrated at the decision level. No raw data sharing. Full explainability.
          </p>

          <div className="fade-in-up-3" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/analyze" className="btn btn-primary btn-lg">
              🔍 Analyze a Transaction
            </Link>
            <Link to="/metrics" className="btn btn-secondary btn-lg">
              📊 View Model Metrics
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>
        <div className="grid-4" style={{ gap: 16 }}>
          {STATS.map((s, i) => (
            <div key={i} className="glass-card fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="glass-card-inner" style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2rem', fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>
                  <AnimatedCounter target={s.value} prefix={s.prefix} suffix={s.suffix} duration={2000 + i * 300} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THREE PILLARS ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Three Pillars of <span className="gradient-text">FraudShield</span>
          </h2>
          <p style={{ color: '#64748b', marginTop: 8 }}>Built on the research paper's core architectural principles</p>
        </div>

        <div className="grid-3">
          {PILLARS.map((p, i) => (
            <div key={i} className="glass-card" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="glass-card-inner">
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{p.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: p.color, marginBottom: 12 }}>{p.title}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.7 }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── REAL WORLD PROBLEM TABLE ─────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Real Problems. <span className="gradient-text">Real Solutions.</span>
          </h2>
          <p style={{ color: '#64748b', marginTop: 8 }}>How FraudShield directly addresses challenges faced by Indian banks today</p>
        </div>

        <div className="glass-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Current Problem</th>
                  <th>FraudShield Solution</th>
                </tr>
              </thead>
              <tbody>
                {REAL_WORLD.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: '#818cf8', fontWeight: 600 }}>{r.bank}</td>
                    <td style={{ color: '#94a3b8' }}>{r.issue}</td>
                    <td style={{ color: '#6ee7b7' }}>{r.solution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE OVERVIEW ───────────────────────────────────────── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 100px' }}>
        <div className="glass-card">
          <div className="glass-card-inner">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>System Architecture</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 28 }}>
              Decision-level integration: FL and GNN pipelines are fully independent. Only scores are combined.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {['Transaction Input', '→', 'FL Model\n(Tabular)', '+', 'GNN Model\n(Structural)', '→', 'Decision Engine\n(Rule-Based)', '→', 'SHAP + LIME\n(Explainability)', '→', 'BLOCK / FLAG / ALLOW'].map((step, i) => (
                step === '→' || step === '+' ? (
                  <div key={i} style={{ color: '#475569', fontSize: '1.2rem', fontWeight: 700 }}>{step}</div>
                ) : (
                  <div key={i} style={{
                    padding: '12px 18px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10,
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    whiteSpace: 'pre-line',
                    lineHeight: 1.4,
                  }}>
                    {step}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const heroStyle = {
  minHeight: '80vh',
  display: 'flex',
  alignItems: 'center',
  padding: '80px 0 60px',
  position: 'relative',
}
