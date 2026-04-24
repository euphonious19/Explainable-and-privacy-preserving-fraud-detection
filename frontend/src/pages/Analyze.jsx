import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || ''

const INITIAL_FORM = {
  amount: '',
  time: '',
  sender_id: '',
  receiver_id: '',
  transaction_type: 'UPI',
  location_risk: 0.3,
  tau_fl_flag: 0.6,
  tau_fl_block: 0.8,
  tau_gnn: 0.7,
}

export default function Analyze() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [samples, setSamples] = useState([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    axios.get(`${API}/api/samples`).then(r => setSamples(r.data.samples || [])).catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const loadSample = (sample) => {
    setForm({
      amount: sample.amount,
      time: sample.time,
      sender_id: sample.sender_id,
      receiver_id: sample.receiver_id,
      transaction_type: sample.transaction_type,
      location_risk: sample.location_risk,
      tau_fl_flag: 0.6,
      tau_fl_block: 0.8,
      tau_gnn: 0.7,
    })
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Predict
      const predRes = await axios.post(`${API}/api/predict`, {
        amount: parseFloat(form.amount),
        time: parseFloat(form.time),
        sender_id: form.sender_id,
        receiver_id: form.receiver_id,
        transaction_type: form.transaction_type,
        location_risk: parseFloat(form.location_risk),
        tau_fl_flag: parseFloat(form.tau_fl_flag),
        tau_fl_block: parseFloat(form.tau_fl_block),
        tau_gnn: parseFloat(form.tau_gnn),
      })
      const pred = predRes.data

      // Explain (parallel)
      const explRes = await axios.post(`${API}/api/explain`, {
        ...pred,
        amount: parseFloat(form.amount),
        time: parseFloat(form.time),
        sender_id: form.sender_id,
        receiver_id: form.receiver_id,
        transaction_type: form.transaction_type,
        location_risk: parseFloat(form.location_risk),
      })

      // Save to alert queue (localStorage)
      const queue = JSON.parse(localStorage.getItem('fraudshield_alerts') || '[]')
      queue.unshift({ ...pred, amount: form.amount, sender_id: form.sender_id, receiver_id: form.receiver_id, transaction_type: form.transaction_type })
      localStorage.setItem('fraudshield_alerts', JSON.stringify(queue.slice(0, 50)))

      // Navigate to results
      navigate('/results', { state: { prediction: pred, explanation: explRes.data, formData: form } })
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || 'Unable to reach the detection service. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Header */}
        <div className="fade-in-up" style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>
            Analyze Transaction
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Enter transaction details to run through the FL + GNN detection pipeline.
          </p>
        </div>

        {/* Quick sample buttons */}
        {samples.length > 0 && (
          <div className="glass-card fade-in-up-1" style={{ marginBottom: 24 }}>
            <div className="glass-card-inner glass-card-sm">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Quick Demo — Click a sample transaction:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {samples.map((s, i) => (
                  <button
                    key={i}
                    className="btn btn-secondary btn-sm"
                    onClick={() => loadSample(s)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="glass-card fade-in-up-2">
            <div className="glass-card-inner">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 24 }}>Transaction Details</h2>

              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="amount">Amount (₹)</label>
                  <input
                    className="form-input"
                    id="amount" name="amount" type="number"
                    placeholder="e.g. 75000"
                    value={form.amount} onChange={handleChange}
                    required min="1"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="time">Time (hour, 0–24)</label>
                  <input
                    className="form-input"
                    id="time" name="time" type="number"
                    placeholder="e.g. 2.5 (2:30 AM)"
                    value={form.time} onChange={handleChange}
                    required min="0" max="24" step="0.1"
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="sender_id">Sender Account ID</label>
                  <input
                    className="form-input"
                    id="sender_id" name="sender_id" type="text"
                    placeholder="e.g. ACC_8821"
                    value={form.sender_id} onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="receiver_id">Receiver Account ID</label>
                  <input
                    className="form-input"
                    id="receiver_id" name="receiver_id" type="text"
                    placeholder="e.g. MUL_3301"
                    value={form.receiver_id} onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="transaction_type">Transaction Type</label>
                  <select
                    className="form-select"
                    id="transaction_type" name="transaction_type"
                    value={form.transaction_type} onChange={handleChange}
                  >
                    {['UPI','NEFT','IMPS','TRANSFER','POS','ATM','ONLINE'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="location_risk">
                    Location Risk ({parseFloat(form.location_risk).toFixed(2)})
                  </label>
                  <input
                    type="range" min="0" max="1" step="0.01"
                    id="location_risk" name="location_risk"
                    value={form.location_risk} onChange={handleChange}
                    style={{ width: '100%', marginTop: 8, accentColor: '#6366f1' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#475569' }}>
                    <span>0 (Safe)</span><span>1 (High Risk)</span>
                  </div>
                </div>
              </div>

              {/* Advanced thresholds */}
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: showAdvanced ? 20 : 0 }}
                onClick={() => setShowAdvanced(v => !v)}
              >
                {showAdvanced ? '▲ Hide' : '▼ Show'} Advanced Thresholds (τF / τG)
              </button>

              {showAdvanced && (
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label" htmlFor="tau_fl_flag">τF (FLAG) ({form.tau_fl_flag})</label>
                    <input
                      type="range" min="0.1" max="0.99" step="0.01"
                      id="tau_fl_flag" name="tau_fl_flag"
                      value={form.tau_fl_flag} onChange={handleChange}
                      style={{ width: '100%', accentColor: '#6366f1' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="tau_fl_block">τF (BLOCK) ({form.tau_fl_block})</label>
                    <input
                      type="range" min="0.1" max="0.99" step="0.01"
                      id="tau_fl_block" name="tau_fl_block"
                      value={form.tau_fl_block} onChange={handleChange}
                      style={{ width: '100%', accentColor: '#ef4444' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="tau_gnn">τG (GNN) ({form.tau_gnn})</label>
                    <input
                      type="range" min="0.1" max="0.99" step="0.01"
                      id="tau_gnn" name="tau_gnn"
                      value={form.tau_gnn} onChange={handleChange}
                      style={{ width: '100%', accentColor: '#10b981' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, padding: '14px 18px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 12, color: '#fca5a5', fontSize: '0.85rem',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 20, justifyContent: 'center' }}
            disabled={loading}
            id="submit-analyze-btn"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                Running FL + GNN Pipeline...
              </>
            ) : (
              <>🔍 Analyze Transaction</>
            )}
          </button>
        </form>

        {/* Info */}
        <div style={{ marginTop: 24, fontSize: '0.75rem', color: '#475569', textAlign: 'center', lineHeight: 1.6 }}>
          🔒 No raw data is stored. Only the detection result is saved to your local session.<br/>
          Model inference runs on the backend — fully private by design.
        </div>
      </div>
    </div>
  )
}
