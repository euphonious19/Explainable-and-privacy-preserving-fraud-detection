import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import ScoreGauge from '../components/ScoreGauge'
import DecisionBadge from '../components/DecisionBadge'
import ShapChart from '../components/ShapChart'
import LimePanel from '../components/LimePanel'
import GraphView from '../components/GraphView'
import ThresholdSlider from '../components/ThresholdSlider'

const TABS = ['Overview', 'SHAP', 'LIME', 'Graph', 'Thresholds']

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Overview')
  const [tauFL, setTauFL] = useState(state?.prediction?.tau_fl || 0.6)
  const [tauGNN, setTauGNN] = useState(state?.prediction?.tau_gnn || 0.7)

  if (!state?.prediction) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤔</div>
        <h2 style={{ marginBottom: 12 }}>No Results Yet</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24 }}>Analyze a transaction first to see results here.</p>
        <Link to="/analyze" className="btn btn-primary">→ Analyze Transaction</Link>
      </div>
    )
  }

  const { prediction: pred, explanation: expl, formData } = state
  const flScore = pred.fl_score
  const gnnScore = pred.gnn_score
  const decision = pred.decision

  return (
    <div className="page-container">
      {/* Back */}
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => navigate(-1)}
        style={{ marginBottom: 32 }}
      >
        ← Back to Analyze
      </button>

      {/* Transaction header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Analysis Results</h1>
          <span className="badge badge-gray" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {pred.transaction_id}
          </span>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
          {formData?.transaction_type} · ₹{parseFloat(formData?.amount || 0).toLocaleString('en-IN')} ·
          {formData?.sender_id} → {formData?.receiver_id} ·
          Latency: <span style={{ color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>{pred.latency_ms}ms</span> ·
          Node: <span style={{ color: '#6ee7b7' }}>{pred.client_id}</span>
        </div>
      </div>

      {/* Score cards + decision */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 20, marginBottom: 32 }}>
        <div className="glass-card fade-in-up">
          <div className="glass-card-inner" style={{ display: 'flex', justifyContent: 'center', padding: '32px 20px' }}>
            <ScoreGauge score={flScore} label="FL Score" decision={decision} size={160} />
          </div>
        </div>
        <div className="glass-card fade-in-up-1">
          <div className="glass-card-inner" style={{ display: 'flex', justifyContent: 'center', padding: '32px 20px' }}>
            <ScoreGauge score={gnnScore} label="GNN Score" decision={decision} size={160} />
          </div>
        </div>
        <div className="glass-card fade-in-up-2">
          <div className="glass-card-inner">
            <DecisionBadge
              decision={decision}
              riskTier={pred.risk_tier}
              reasoning={pred.reasoning}
            />
          </div>
        </div>
      </div>

      {/* Model metadata row */}
      <div className="grid-4 fade-in-up-3" style={{ marginBottom: 32 }}>
        {[
          { label: 'Confidence', value: `${(pred.confidence * 100).toFixed(1)}%`, color: '#818cf8' },
          { label: 'Pattern Type', value: pred.pattern_type, color: '#f59e0b' },
          { label: 'FL Threshold', value: `τF = ${pred.tau_fl_flag}/${pred.tau_fl_block}`, color: flScore > pred.tau_fl_flag ? '#ef4444' : '#6ee7b7' },
          { label: 'GNN Threshold', value: `τG = ${pred.tau_gnn}`, color: gnnScore > pred.tau_gnn ? '#ef4444' : '#6ee7b7' },
        ].map((m, i) => (
          <div key={i} className="glass-card">
            <div className="glass-card-inner glass-card-sm" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', fontWeight: 700, color: m.color }}>
                {m.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? '#6366f1' : 'transparent'}`,
              color: activeTab === tab ? '#818cf8' : '#64748b',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif',
              marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="glass-card fade-in-up">
        <div className="glass-card-inner glass-card-lg">
          {activeTab === 'Overview' && (
            <div>
              <h3 className="section-title" style={{ marginBottom: 20 }}>Decision Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>FL Model (Tabular)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <MetaRow label="Score" value={flScore.toFixed(4)} mono color={flScore > 0.6 ? '#fca5a5' : '#6ee7b7'} />
                    <MetaRow label="Threshold" value={`τF(flag)=${pred.tau_fl_flag}, τF(block)=${pred.tau_fl_block}`} mono />
                    <MetaRow label="Decision" value={pred.fl_above_threshold ? 'ABOVE THRESHOLD' : 'Below threshold'} color={pred.fl_above_threshold ? '#ef4444' : '#10b981'} />
                    <MetaRow label="Fed Node" value={pred.client_id} />
                    <MetaRow label="Dataset" value="European Credit Card" />
                  </div>
                </div>
                <div>
                  <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>GNN Model (Structural)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <MetaRow label="Score" value={gnnScore.toFixed(4)} mono color={gnnScore > 0.7 ? '#fca5a5' : '#6ee7b7'} />
                    <MetaRow label="Threshold" value={`τG = ${pred.tau_gnn}`} mono />
                    <MetaRow label="Decision" value={pred.gnn_above_threshold ? 'ABOVE THRESHOLD' : 'Below threshold'} color={pred.gnn_above_threshold ? '#ef4444' : '#10b981'} />
                    <MetaRow label="Pattern" value={pred.pattern_type} />
                    <MetaRow label="Dataset" value="PaySim (precomputed embeddings)" />
                  </div>
                </div>
              </div>

              <div className="divider" />
              <div style={{
                padding: '16px',
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 10,
                fontSize: '0.9rem',
                color: '#e2e8f0',
                lineHeight: 1.6,
              }}>
                <div style={{ marginBottom: 12 }}>
                  🧑‍💼 <strong>Bank Manager Summary:</strong><br/>
                  <span style={{ color: '#f8fafc', display: 'block', marginTop: 4 }}>{pred.reasoning}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a5b4fc', borderTop: '1px solid rgba(129,140,248,0.2)', paddingTop: 12 }}>
                  🔍 <strong>Technical Integration Rule:</strong>&nbsp;
                  {pred.decision === 'BLOCK'
                    ? `Both models detected extremely high risk (FL > ${pred.tau_fl_block} and GNN > ${pred.tau_gnn}).`
                    : pred.decision === 'FLAG'
                    ? `One of the models crossed its warning threshold (FL > ${pred.tau_fl_flag} or GNN > ${pred.tau_gnn}).`
                    : `Neither model exceeded its threshold. Safe to process.`}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SHAP' && (
            <div>
              <h3 className="section-title">SHAP Feature Contributions</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
                Global + local feature importance from the Federated Learning model.
                Red bars increase fraud probability; green bars decrease it.
              </p>
              <ShapChart
                features={expl?.shap?.feature_contributions || []}
                baseValue={expl?.shap?.base_value || 0.1}
                outputValue={expl?.shap?.output_value || flScore}
              />
              <div style={{ marginTop: 16, fontSize: '0.7rem', color: '#475569' }}>
                Method: {expl?.shap?.method || 'SHAP LinearExplainer'}
              </div>
            </div>
          )}

          {activeTab === 'LIME' && (
            <div>
              <h3 className="section-title">LIME Instance Explanation</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
                Local interpretable model-agnostic explanation for this specific transaction.
              </p>
              <LimePanel
                narrative={expl?.lime?.narrative || ''}
                conditions={expl?.lime?.conditions || []}
                prediction={expl?.lime?.prediction || flScore}
              />
            </div>
          )}

          {activeTab === 'Graph' && (
            <div>
              <h3 className="section-title">Transaction Network Graph</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
                Structural analysis of the account network around this transaction.
                Drag nodes to explore. Red edges = suspicious flows.
              </p>
              <GraphView
                subgraph={expl?.subgraph || null}
                pattern={pred.pattern_type || ''}
              />
            </div>
          )}

          {activeTab === 'Thresholds' && (
            <div>
              <h3 className="section-title">Live Threshold Tuning</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
                Adjust τF and τG to see how the decision changes in real-time.
                This is the paper's auditable policy engine — no retraining needed.
              </p>
              <ThresholdSlider
                tauFL={tauFL}
                tauGNN={tauGNN}
                flScore={flScore}
                gnnScore={gnnScore}
                onChange={(fl, gnn) => { setTauFL(fl); setTauGNN(gnn) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value, mono = false, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{
        fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
        color: color || '#f1f5f9',
        fontWeight: 600,
        fontSize: mono ? '0.8rem' : '0.85rem',
      }}>{value}</span>
    </div>
  )
}
