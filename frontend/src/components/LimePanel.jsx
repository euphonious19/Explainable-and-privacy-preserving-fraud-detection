/**
 * LIME explanation panel.
 * Shows conditions, weights, and a narrative summary.
 * @param {string} narrative - human-readable explanation
 * @param {Array} conditions - [{feature, condition, weight, direction}]
 * @param {number} prediction - FL score
 */
export default function LimePanel({ narrative = '', conditions = [], prediction = 0.5 }) {
  return (
    <div>
      {/* Narrative */}
      <div style={{
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        fontSize: '0.9rem',
        color: '#c7d2fe',
        lineHeight: 1.7,
        fontStyle: 'italic',
      }}>
        💬 {narrative || 'No explanation available.'}
      </div>

      {/* Conditions table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {conditions.map((c, i) => {
          const isFraud = c.direction === 'FRAUD'
          const absWeight = Math.abs(c.weight)
          const maxWeight = Math.max(...conditions.map(x => Math.abs(x.weight)))
          const pct = maxWeight > 0 ? (absWeight / maxWeight) * 100 : 0

          return (
            <div key={i} style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
              border: `1px solid ${isFraud ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>{c.feature}</span>
                  <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: 8 }}>{c.condition}</span>
                </div>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: isFraud ? '#fca5a5' : '#6ee7b7',
                }}>
                  {isFraud ? '+' : ''}{c.weight.toFixed(4)}
                </span>
              </div>

              {/* Weight bar */}
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: isFraud
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : 'linear-gradient(90deg, #10b981, #059669)',
                  borderRadius: 2,
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>

              <div style={{ marginTop: 6, fontSize: '0.7rem', color: isFraud ? '#fca5a5' : '#6ee7b7', opacity: 0.7 }}>
                {isFraud ? '↑ Pushes toward fraud' : '↓ Pushes toward legitimate'}
              </div>
            </div>
          )
        })}
      </div>

      {conditions.length === 0 && (
        <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
          No LIME conditions available
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: '0.7rem', color: '#475569' }}>
        Method: LIME TabularExplainer — Instance-level local approximation
      </div>
    </div>
  )
}
