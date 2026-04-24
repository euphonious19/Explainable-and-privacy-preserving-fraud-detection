import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line } from 'recharts'

const API = import.meta.env.VITE_API_URL || ''

export default function Metrics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/api/metrics`).then(r => { setData(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <div className="spinner" />
    </div>
  )

  const m = data || {}
  const comparison = m.comparison_table || []
  const cm = m.confusion_matrix?.combined || {}
  const conv = m.federated_convergence || {}
  const shap = m.shap_consistency || []
  const gnnEarly = m.gnn_early_stopping || {}

  const compChartData = comparison.map(r => ({
    method: r.method.replace('(Our System)', '').replace('(Centralised)', '').trim(),
    Recall: +(r.recall * 100).toFixed(1),
    Precision: +(r.precision * 100).toFixed(1),
    F1: +(r.f1_score * 100).toFixed(1),
    privacy: r.privacy,
  }))

  const convData = (conv.rounds || []).slice(0, 50).map((r, i) => ({
    round: r,
    loss: conv.global_loss?.[i] ?? 0,
    accuracy: +(((conv.global_accuracy?.[i] ?? 0.99)) * 100).toFixed(3),
  }))

  const HIGHLIGHT_COLOR = '#6366f1'

  return (
    <div className="page-container">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Model Performance Dashboard</h1>
        <p style={{ color: '#94a3b8' }}>Static metrics from the research paper — not recomputed at inference time.</p>
      </div>

      {/* Top KPI cards */}
      <div className="grid-3" style={{ marginBottom: 32 }}>
        {[
          { label: 'Combined Recall', value: '98.5%', sub: 'FL + GNN (Decision-Level)', color: '#10b981' },
          { label: 'Combined AUC-ROC', value: '99.3%', sub: 'FL + GNN Integrated System', color: '#818cf8' },
          { label: 'Avg Detection Time', value: '42ms', sub: 'Full FL + GNN + Explainability', color: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="glass-card">
            <div className="glass-card-inner" style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2.4rem', fontWeight: 800, color: k.color }}>{k.value}</div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', marginTop: 8 }}>{k.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Method comparison bar chart */}
      <div className="glass-card" style={{ marginBottom: 28 }}>
        <div className="glass-card-inner">
          <h2 className="section-title">Method Comparison — Recall / Precision / F1</h2>
          <p className="section-sub">FraudShield achieves 98.5% combined recall, outperforming federated baselines while strictly maintaining data privacy.</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={compChartData} margin={{ top: 0, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="method" tick={{ fill: '#64748b', fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
              <YAxis domain={[90, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '0.8rem' }} />
              <Bar dataKey="Recall" fill="#ef4444" radius={[4,4,0,0]} />
              <Bar dataKey="Precision" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar dataKey="F1" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Confusion matrix */}
        <div className="glass-card">
          <div className="glass-card-inner">
            <h2 className="section-title">Confusion Matrix (Combined System)</h2>
            <p className="section-sub">European Credit Card + PaySim test sets</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'True Negative', value: cm.true_negative?.toLocaleString(), desc: 'Legitimate, correctly allowed', color: '#10b981' },
                { label: 'False Positive', value: cm.false_positive?.toLocaleString(), desc: 'Legitimate, incorrectly blocked', color: '#f59e0b' },
                { label: 'False Negative', value: cm.false_negative?.toLocaleString(), desc: 'Fraud, incorrectly allowed ⚠️', color: '#ef4444' },
                { label: 'True Positive', value: cm.true_positive?.toLocaleString(), desc: 'Fraud, correctly blocked ✓', color: '#818cf8' },
              ].map((cell, i) => (
                <div key={i} style={{
                  padding: '18px', borderRadius: 10,
                  background: `rgba(${cell.color === '#10b981' ? '16,185,129' : cell.color === '#f59e0b' ? '245,158,11' : cell.color === '#ef4444' ? '239,68,68' : '99,102,241'},0.08)`,
                  border: `1px solid ${cell.color}22`,
                }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.6rem', fontWeight: 800, color: cell.color }}>{cell.value}</div>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.85rem', marginTop: 4 }}>{cell.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>{cell.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Federated convergence */}
        <div className="glass-card">
          <div className="glass-card-inner">
            <h2 className="section-title">Federated Learning Convergence</h2>
            <p className="section-sub">Global model loss over 50 FedAvg rounds (5 clients)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={convData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="round" tick={{ fill: '#64748b', fontSize: 10 }} label={{ value: 'Round', position: 'insideBottom', fill: '#475569', fontSize: 10 }} />
                <YAxis yAxisId="loss" tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }} />
                <Line yAxisId="loss" type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} name="Global Loss" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* SHAP Consistency */}
        <div className="glass-card">
          <div className="glass-card-inner">
            <h2 className="section-title">Explainability: SHAP Feature Stability</h2>
            <p className="section-sub">Top features across 5 sampled true-positive fraud instances.</p>
            <div style={{ marginTop: 16 }}>
              {shap.map((s, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#f1f5f9', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>Feature {s.feature}</span>
                    <span>{s.stability_pct}% consistency</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${s.stability_pct}%`, height: '100%', background: s.stability_pct === 100 ? '#10b981' : '#6366f1', borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>Appears in top-3 for {s.count_in_top_3} of 5 cases</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* GNN Early Stopping */}
        <div className="glass-card">
          <div className="glass-card-inner">
            <h2 className="section-title">GNN Early Stopping (Epoch 20)</h2>
            <p className="section-sub">Structural detection performance peaks early to avoid over-smoothing.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              <div style={{ padding: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Peak Recall (Epoch {gnnEarly.best_epoch || 20})</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
                  {((gnnEarly.best_recall || 0.9763) * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ padding: 16, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 10 }}>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Epoch 50 Recall (Baseline)</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
                  {((gnnEarly.epoch_50_recall || 0.8558) * 100).toFixed(1)}%
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.5 }}>
                Trained with positive class weight <strong>{gnnEarly.positive_class_weight || 773.75}</strong> to handle 1:774 class imbalance in PaySim.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-model detailed table */}
      <div className="glass-card" style={{ marginBottom: 28 }}>
        <div className="glass-card-inner">
          <h2 className="section-title">Detailed Model Statistics</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Dataset</th>
                  <th>Recall</th>
                  <th>Precision</th>
                  <th>F1</th>
                  <th>AUC-ROC</th>
                  <th>Privacy</th>
                  <th>Explainable</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((r, i) => (
                  <tr key={i} style={{ background: r.method.includes('FraudShield') ? 'rgba(99,102,241,0.06)' : undefined }}>
                    <td style={{ color: r.method.includes('FraudShield') ? '#818cf8' : '#f1f5f9', fontWeight: r.method.includes('FraudShield') ? 700 : 400 }}>
                      {r.method}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#475569' }}>
                      {r.dataset || 'Credit Card'}
                    </td>
                    <td style={{ color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{(r.recall * 100).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(r.precision * 100).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{(r.f1_score * 100).toFixed(1)}%</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#818cf8' }}>{r.auc_roc ? r.auc_roc.toFixed(3) : '—'}</td>
                    <td>{r.privacy ? <span style={{ color: '#10b981' }}>✓ Yes</span> : <span style={{ color: '#ef4444' }}>✗ No</span>}</td>
                    <td>{r.explainable ? <span style={{ color: '#10b981' }}>✓ Yes</span> : <span style={{ color: '#ef4444' }}>✗ No</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Real-world context */}
      <div className="glass-card">
        <div className="glass-card-inner">
          <h2 className="section-title">Regulatory & Real-World Context</h2>
          <div className="grid-3">
            {[
              { icon: '🏛️', label: 'RBI Compliance', value: 'Data Localisation 2018', desc: 'No cross-border raw data transfer' },
              { icon: '📱', label: 'UPI Fraud (2023)', value: '₹1,087 Crore', desc: 'Annual fraud losses in India' },
              { icon: '🛡️', label: 'Privacy Guarantee', value: '5-Node Federated', desc: 'No central data lake required' },
            ].map((item, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '20px 16px' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '1.1rem', color: '#818cf8', marginBottom: 4 }}>{item.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
