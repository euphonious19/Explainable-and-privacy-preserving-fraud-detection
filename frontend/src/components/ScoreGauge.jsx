import { useEffect, useRef } from 'react'

const COLOR_MAP = {
  BLOCK: { stroke: '#ef4444', fill: 'rgba(239,68,68,0.15)', text: '#fca5a5', label: 'HIGH RISK' },
  FLAG:  { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.15)', text: '#fcd34d', label: 'MEDIUM RISK' },
  ALLOW: { stroke: '#10b981', fill: 'rgba(16,185,129,0.15)', text: '#6ee7b7', label: 'LOW RISK' },
}

/**
 * Animated circular gauge showing a score from 0 to 1.
 * @param {number} score  - value 0 to 1
 * @param {string} label  - "FL Score" or "GNN Score"
 * @param {string} decision - "BLOCK" | "FLAG" | "ALLOW"
 */
export default function ScoreGauge({ score = 0, label = 'Score', decision = 'ALLOW', size = 160 }) {
  const circleRef = useRef(null)
  const colors = COLOR_MAP[decision] || COLOR_MAP.ALLOW

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference
  const strokeOffset = circumference * (1 - score)

  useEffect(() => {
    // Animate stroke from 0 to target
    if (!circleRef.current) return
    circleRef.current.style.strokeDashoffset = circumference
    const timer = setTimeout(() => {
      if (circleRef.current) {
        circleRef.current.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)'
        circleRef.current.style.strokeDashoffset = strokeOffset
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [score, strokeOffset, circumference])

  const pct = Math.round(score * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={10}
          />
          {/* Fill glow */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={colors.fill}
            strokeWidth={14}
            strokeDasharray={strokeDash}
            strokeDashoffset={circumference * (1 - score)}
            strokeLinecap="round"
            style={{ filter: `blur(4px)` }}
          />
          {/* Main arc */}
          <circle
            ref={circleRef}
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={10}
            strokeDasharray={strokeDash}
            strokeDashoffset={circumference}
            strokeLinecap="round"
          />
        </svg>

        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: size > 140 ? '1.8rem' : '1.3rem',
            fontWeight: 700,
            color: colors.text,
            lineHeight: 1,
          }}>
            {pct}<span style={{ fontSize: '0.7em' }}>%</span>
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.7rem', color: colors.stroke, fontWeight: 700, marginTop: 2 }}>
          {colors.label}
        </div>
      </div>
    </div>
  )
}
