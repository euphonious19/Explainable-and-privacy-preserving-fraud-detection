import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div style={{
      background: 'rgba(13,15,26,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: '0.8rem',
    }}>
      <div style={{ color: '#f1f5f9', fontWeight: 600 }}>{d.payload.feature}</div>
      <div style={{ color: d.value > 0 ? '#fca5a5' : '#6ee7b7', marginTop: 4 }}>
        SHAP: {d.value > 0 ? '+' : ''}{d.value.toFixed(4)}
      </div>
      <div style={{ color: '#64748b', marginTop: 2 }}>
        {d.value > 0 ? '↑ Increases fraud probability' : '↓ Reduces fraud probability'}
      </div>
    </div>
  )
}

/**
 * SHAP bar chart showing top feature contributions.
 * @param {Array} features - [{feature, value, raw_value}]
 * @param {number} baseValue - SHAP base value
 * @param {number} outputValue - model output
 */
export default function ShapChart({ features = [], baseValue = 0.1, outputValue = 0.5 }) {
  if (!features.length) return (
    <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>
      No SHAP data available
    </div>
  )

  const data = features.map(f => ({
    feature: f.feature,
    value: parseFloat(f.value.toFixed(5)),
    raw_value: f.raw_value,
  })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 10)

  return (
    <div>
      {/* Summary bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24,
        marginBottom: 20, padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Base Value</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700, color: '#818cf8' }}>{baseValue.toFixed(3)}</div>
        </div>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Output (FL Score)</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1rem', fontWeight: 700, color: outputValue > 0.6 ? '#fca5a5' : '#6ee7b7' }}>
            {outputValue.toFixed(3)}
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={90}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value > 0 ? 'rgba(239,68,68,0.8)' : 'rgba(16,185,129,0.8)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: '0.75rem', color: '#64748b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(239,68,68,0.8)' }} />
          Increases fraud probability
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(16,185,129,0.8)' }} />
          Decreases fraud probability
        </div>
      </div>
    </div>
  )
}
