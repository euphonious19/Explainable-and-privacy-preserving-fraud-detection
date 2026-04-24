/**
 * Threshold tuning sliders for τF and τG.
 * Moving these changes the decision in real-time without a new API call.
 * This is the paper's "auditable policy engine" demonstration.
 *
 * @param {number} tauFL     - current FL threshold
 * @param {number} tauGNN    - current GNN threshold
 * @param {number} flScore   - fixed FL score from last prediction
 * @param {number} gnnScore  - fixed GNN score from last prediction
 * @param {function} onChange - (tauFL, tauGNN) callback
 */
export default function ThresholdSlider({ tauFL = 0.6, tauGNN = 0.7, flScore = 0, gnnScore = 0, onChange }) {
  // Compute live decision based on current thresholds
  const flAbove = flScore > tauFL
  const gnnAbove = gnnScore > tauGNN
  const decision = flAbove && gnnAbove ? 'BLOCK' : (flAbove || gnnAbove ? 'FLAG' : 'ALLOW')
  const decisionColor = { BLOCK: '#ef4444', FLAG: '#f59e0b', ALLOW: '#10b981' }[decision]
  const decisionIcon = { BLOCK: '⛔', FLAG: '⚠️', ALLOW: '✅' }[decision]

  const handleFL = (e) => onChange(parseFloat(e.target.value), tauGNN)
  const handleGNN = (e) => onChange(tauFL, parseFloat(e.target.value))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 12,
        padding: '14px 18px',
        fontSize: '0.8rem',
        color: '#a5b4fc',
        lineHeight: 1.6,
      }}>
        🔬 <strong>Live Threshold Tuning</strong> — Adjust τF and τG below. 
        The decision updates instantly, <em>without retraining</em>. 
        This demonstrates the paper's auditable rule-based policy engine.
      </div>

      {/* FL Threshold */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>τF — FL Threshold</span>
            <span style={{ marginLeft: 10, fontSize: '0.75rem', color: '#64748b' }}>
              FL Score {flScore.toFixed(3)} {flAbove ? '>' : '≤'} τF
            </span>
          </div>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700, fontSize: '0.9rem',
            color: flAbove ? '#fca5a5' : '#6ee7b7',
          }}>{tauFL.toFixed(2)}</span>
        </div>

        <div style={{ position: 'relative', height: 36 }}>
          {/* Score indicator */}
          <div style={{
            position: 'absolute',
            left: `${flScore * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
            background: '#4f46e5',
            color: '#fff',
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: '0.65rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            pointerEvents: 'none',
          }}>
            FL: {flScore.toFixed(2)}
          </div>

          <input
            type="range" min="0.1" max="0.99" step="0.01"
            value={tauFL}
            onChange={handleFL}
            style={{ width: '100%', marginTop: 20, accentColor: '#6366f1', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>
          <span>0.1 (More sensitive)</span>
          <span>0.99 (More strict)</span>
        </div>
      </div>

      {/* GNN Threshold */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem' }}>τG — GNN Threshold</span>
            <span style={{ marginLeft: 10, fontSize: '0.75rem', color: '#64748b' }}>
              GNN Score {gnnScore.toFixed(3)} {gnnAbove ? '>' : '≤'} τG
            </span>
          </div>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 700, fontSize: '0.9rem',
            color: gnnAbove ? '#fca5a5' : '#6ee7b7',
          }}>{tauGNN.toFixed(2)}</span>
        </div>

        <div style={{ position: 'relative', height: 36 }}>
          <div style={{
            position: 'absolute',
            left: `${gnnScore * 100}%`,
            top: 0,
            transform: 'translateX(-50%)',
            background: '#0f766e',
            color: '#fff',
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: '0.65rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
            pointerEvents: 'none',
          }}>
            GNN: {gnnScore.toFixed(2)}
          </div>

          <input
            type="range" min="0.1" max="0.99" step="0.01"
            value={tauGNN}
            onChange={handleGNN}
            style={{ width: '100%', marginTop: 20, accentColor: '#10b981', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>
          <span>0.1 (More sensitive)</span>
          <span>0.99 (More strict)</span>
        </div>
      </div>

      {/* Live decision output */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '16px 24px',
        background: `rgba(${decision === 'BLOCK' ? '239,68,68' : decision === 'FLAG' ? '245,158,11' : '16,185,129'},0.1)`,
        border: `1px solid ${decisionColor}33`,
        borderRadius: 12,
      }}>
        <span style={{ fontSize: '1.5rem' }}>{decisionIcon}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: decisionColor }}>
            {decision}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
            {flAbove ? 'FL ✓' : 'FL ✗'} &nbsp;·&nbsp; {gnnAbove ? 'GNN ✓' : 'GNN ✗'}
          </div>
        </div>
      </div>

      <div style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center' }}>
        Rule: IF FL &gt; τF AND GNN &gt; τG → BLOCK &nbsp;|&nbsp;
        FL &gt; τF OR GNN &gt; τG → FLAG &nbsp;|&nbsp; else → ALLOW
      </div>
    </div>
  )
}
