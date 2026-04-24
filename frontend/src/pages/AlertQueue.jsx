import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const DC = {
  BLOCK: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'BLOCKED', icon: '⛔' },
  FLAG:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'FLAGGED', icon: '⚠️' },
  ALLOW: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'ALLOWED', icon: '✅' },
}

const DEMO_ALERTS = [
  { transaction_id: 'TXN_DEMO001', amount: 125000, sender_id: 'ACC_9921', receiver_id: 'MUL_3301', transaction_type: 'TRANSFER', fl_score: 0.89, gnn_score: 0.82, decision: 'BLOCK', risk_tier: 'CRITICAL', pattern_type: 'Fan-In Money Mule Chain', latency_ms: 41, timestamp: new Date(Date.now() - 300000).toISOString(), status: 'pending' },
  { transaction_id: 'TXN_DEMO002', amount: 48500, sender_id: 'ACC_5512', receiver_id: 'ACC_8812', transaction_type: 'ONLINE', fl_score: 0.71, gnn_score: 0.62, decision: 'FLAG', risk_tier: 'HIGH', pattern_type: 'Moderate Structural Risk', latency_ms: 38, timestamp: new Date(Date.now() - 600000).toISOString(), status: 'pending' },
  { transaction_id: 'TXN_DEMO003', amount: 3450, sender_id: 'ACC_1122', receiver_id: 'MERCHANT_BB', transaction_type: 'POS', fl_score: 0.08, gnn_score: 0.05, decision: 'ALLOW', risk_tier: 'LOW', pattern_type: 'Clean Transaction', latency_ms: 29, timestamp: new Date(Date.now() - 900000).toISOString(), status: 'resolved' },
  { transaction_id: 'TXN_DEMO004', amount: 98000, sender_id: 'SUS_8821', receiver_id: 'ATM_07', transaction_type: 'ATM', fl_score: 0.94, gnn_score: 0.91, decision: 'BLOCK', risk_tier: 'CRITICAL', pattern_type: 'Known Suspicious Endpoint', latency_ms: 44, timestamp: new Date(Date.now() - 1200000).toISOString(), status: 'escalated' },
  { transaction_id: 'TXN_DEMO005', amount: 65000, sender_id: 'CORP_INFOSYS', receiver_id: 'ACC_2241', transaction_type: 'NEFT', fl_score: 0.05, gnn_score: 0.04, decision: 'ALLOW', risk_tier: 'LOW', pattern_type: 'Clean Transaction', latency_ms: 33, timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'resolved' },
  { transaction_id: 'TXN_DEMO006', amount: 49750, sender_id: 'ACC_7741', receiver_id: 'ACC_3318', transaction_type: 'TRANSFER', fl_score: 0.67, gnn_score: 0.58, decision: 'FLAG', risk_tier: 'MEDIUM', pattern_type: 'Layering / Structuring Pattern', latency_ms: 36, timestamp: new Date(Date.now() - 2400000).toISOString(), status: 'pending' },
]

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
}

export default function AlertQueue() {
  const [alerts, setAlerts] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('timestamp')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('fraudshield_alerts') || '[]')
    const withStatus = stored.map(a => ({
      ...a,
      status: a.status || (a.decision === 'ALLOW' ? 'resolved' : 'pending'),
    }))
    setAlerts(withStatus.slice(0, 40))
  }, [])

  const markStatus = (txnId, newStatus) => {
    setAlerts(prev => prev.map(a => a.transaction_id === txnId ? { ...a, status: newStatus } : a))
  }

  const counts = { ALL: alerts.length, BLOCK: alerts.filter(a => a.decision === 'BLOCK').length, FLAG: alerts.filter(a => a.decision === 'FLAG').length, ALLOW: alerts.filter(a => a.decision === 'ALLOW').length }

  const filtered = alerts
    .filter(a => filter === 'ALL' || a.decision === filter)
    .filter(a => !search || a.transaction_id.toLowerCase().includes(search.toLowerCase()) || String(a.sender_id).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'fl_score') return b.fl_score - a.fl_score
      if (sortBy === 'gnn_score') return b.gnn_score - a.gnn_score
      if (sortBy === 'amount') return parseFloat(b.amount) - parseFloat(a.amount)
      return new Date(b.timestamp) - new Date(a.timestamp)
    })

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Analyst Alert Queue</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Review, resolve, or escalate flagged transactions in real time.</p>
        </div>
        <Link to="/analyze" className="btn btn-primary">+ Analyze New Transaction</Link>
      </div>

      {/* Summary filter cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { key: 'ALL', label: 'Total', c: '#818cf8' },
          { key: 'BLOCK', label: 'Blocked', c: '#ef4444' },
          { key: 'FLAG', label: 'Flagged', c: '#f59e0b' },
          { key: 'ALLOW', label: 'Allowed', c: '#10b981' },
        ].map(({ key, label, c }) => (
          <button
            key={key}
            id={`filter-${key.toLowerCase()}`}
            onClick={() => setFilter(key)}
            style={{
              background: filter === key ? `${c}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${filter === key ? c + '44' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 12, padding: '16px 20px',
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.8rem', fontWeight: 800, color: c, lineHeight: 1 }}>{counts[key]}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          id="alert-search"
          className="form-input"
          placeholder="Search by TX ID or sender..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select id="alert-sort" className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 200 }}>
          <option value="timestamp">Sort: Latest First</option>
          <option value="fl_score">Sort: FL Score ↓</option>
          <option value="gnn_score">Sort: GNN Score ↓</option>
          <option value="amount">Sort: Amount ↓</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Amount</th>
                <th>Type</th>
                <th>FL Score</th>
                <th>GNN Score</th>
                <th>Decision</th>
                <th>Pattern</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const dc = DC[a.decision] || DC.ALLOW
                const statusColor = a.status === 'resolved' ? '#10b981' : a.status === 'escalated' ? '#ef4444' : '#f59e0b'
                const statusLabel = a.status === 'resolved' ? 'Resolved' : a.status === 'escalated' ? 'Escalated' : 'Pending Review'
                return (
                  <tr key={i}>
                    <td>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: '#818cf8' }}>{a.transaction_id}</div>
                      <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 2 }}>{a.sender_id} → {a.receiver_id}</div>
                    </td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: '#f1f5f9' }}>
                      ₹{parseFloat(a.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td><span className="badge badge-blue">{a.transaction_type}</span></td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: a.fl_score > 0.6 ? '#fca5a5' : '#6ee7b7' }}>
                        {Number(a.fl_score).toFixed(3)}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: a.gnn_score > 0.7 ? '#fca5a5' : '#6ee7b7' }}>
                        {Number(a.gnn_score).toFixed(3)}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 999,
                        background: dc.bg, color: dc.color,
                        border: `1px solid ${dc.color}33`,
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>
                        {dc.icon} {dc.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: 140 }}>{a.pattern_type || '—'}</td>
                    <td><span style={{ color: statusColor, fontSize: '0.75rem', fontWeight: 600 }}>{statusLabel}</span></td>
                    <td style={{ fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>{formatTime(a.timestamp)}</td>
                    <td>
                      {a.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-sm"
                            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '4px 10px', fontSize: '0.7rem' }}
                            onClick={() => markStatus(a.transaction_id, 'resolved')}
                          >✓ Resolve</button>
                          {a.decision !== 'ALLOW' && (
                            <button
                              className="btn btn-sm"
                              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '4px 10px', fontSize: '0.7rem' }}
                              onClick={() => markStatus(a.transaction_id, 'escalated')}
                            >↑ Escalate</button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: '#475569' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>No transactions match your filter.</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: '0.75rem', color: '#475569' }}>
        Showing {filtered.length} of {alerts.length} · Live alerts appear as you analyze transactions.
      </div>
    </div>
  )
}
