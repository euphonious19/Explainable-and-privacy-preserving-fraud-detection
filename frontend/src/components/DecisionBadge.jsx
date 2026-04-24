const CONFIG = {
  BLOCK: {
    label: '🔴 BLOCKED',
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))',
    border: 'rgba(239,68,68,0.4)',
    color: '#fca5a5',
    glow: '0 0 30px rgba(239,68,68,0.3)',
    description: 'Transaction blocked — both FL & GNN exceeded thresholds',
    pulse: 'pulse-red',
    icon: '⛔',
    rbiNote: 'Reported to RBI Fraud Database',
  },
  FLAG: {
    label: '🟡 FLAGGED',
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))',
    border: 'rgba(245,158,11,0.4)',
    color: '#fcd34d',
    glow: '0 0 30px rgba(245,158,11,0.3)',
    description: 'Transaction flagged — one model exceeded threshold; manual review required',
    pulse: 'pulse-amber',
    icon: '⚠️',
    rbiNote: 'Queued for analyst review',
  },
  ALLOW: {
    label: '🟢 ALLOWED',
    bg: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))',
    border: 'rgba(16,185,129,0.3)',
    color: '#6ee7b7',
    glow: '0 0 30px rgba(16,185,129,0.2)',
    description: 'Transaction allowed — both models below thresholds',
    pulse: '',
    icon: '✅',
    rbiNote: 'Transaction processed normally',
  },
}

/**
 * Large decision badge with pulsing animation and description.
 * @param {string} decision - "BLOCK" | "FLAG" | "ALLOW"
 * @param {string} riskTier - "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
 * @param {string} reasoning - reasoning text from API
 */
export default function DecisionBadge({ decision = 'ALLOW', riskTier = 'LOW', reasoning = '' }) {
  const cfg = CONFIG[decision] || CONFIG.ALLOW

  return (
    <div
      className={cfg.pulse}
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 20,
        padding: '28px 32px',
        boxShadow: cfg.glow,
        textAlign: 'center',
      }}
    >
      {/* Main decision */}
      <div style={{ fontSize: '3rem', marginBottom: 4 }}>{cfg.icon}</div>
      <div style={{
        fontSize: '2rem',
        fontWeight: 900,
        color: cfg.color,
        letterSpacing: '-0.02em',
        fontFamily: 'Inter, sans-serif',
      }}>
        {cfg.label}
      </div>

      {/* Risk tier */}
      <div style={{
        display: 'inline-block',
        marginTop: 12,
        padding: '4px 14px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.07)',
        border: `1px solid ${cfg.border}`,
        fontSize: '0.75rem',
        fontWeight: 700,
        color: cfg.color,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        {riskTier} RISK
      </div>

      {/* Description */}
      <p style={{ marginTop: 16, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
        {cfg.description}
      </p>

      {/* Reasoning */}
      {reasoning && (
        <p style={{
          marginTop: 12,
          fontSize: '0.8rem',
          color: '#64748b',
          fontStyle: 'italic',
          lineHeight: 1.5,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 12,
        }}>
          {reasoning}
        </p>
      )}

      {/* RBI note */}
      <div style={{
        marginTop: 16,
        fontSize: '0.7rem',
        color: cfg.color,
        opacity: 0.7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}>
        <span>🏛️</span>
        <span>{cfg.rbiNote}</span>
      </div>
    </div>
  )
}
