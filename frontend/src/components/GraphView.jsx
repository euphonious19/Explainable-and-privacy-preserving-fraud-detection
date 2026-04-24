import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const NODE_COLORS = {
  source:      { fill: '#1e3a5f', stroke: '#3b82f6' },
  sender:      { fill: '#1e1b4b', stroke: '#818cf8' },
  receiver:    { fill: '#0f2a1a', stroke: '#10b981' },
  mule:        { fill: '#3b0000', stroke: '#ef4444' },
  destination: { fill: '#2a1500', stroke: '#f59e0b' },
}

const LABEL_COLORS = {
  source: '#93c5fd', sender: '#a5b4fc', receiver: '#6ee7b7',
  mule: '#fca5a5', destination: '#fcd34d',
}

export default function GraphView({ subgraph = null, pattern = '' }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (!subgraph || !subgraph.nodes?.length) return
    renderGraph(svgRef.current, subgraph)
  }, [subgraph])

  if (!subgraph || !subgraph.nodes?.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#64748b' }}>
        Submit a transaction to view its network graph
      </div>
    )
  }

  return (
    <div>
      {/* Pattern label */}
      {pattern && (
        <div style={{
          marginBottom: 16, padding: '8px 14px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 8, fontSize: '0.8rem', color: '#fca5a5', display: 'inline-flex', gap: 8, alignItems: 'center',
        }}>
          <span>🔍</span>
          <strong>Detected Pattern:</strong> {pattern}
        </div>
      )}

      <svg ref={svgRef} style={{ width: '100%', height: 380, borderRadius: 12 }} />

      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
        {Object.entries(LABEL_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        ))}
      </div>
    </div>
  )
}

function renderGraph(svgEl, subgraph) {
  if (!svgEl) return

  // Clone nodes and edges because D3 mutates them (replaces source string with object)
  // This prevents crashes when switching tabs back and forth.
  const nodes = subgraph.nodes.map(n => ({ ...n }))
  const edges = subgraph.edges.map(e => ({ ...e }))
  
  const width = svgEl.clientWidth || 600
  const height = 380

  d3.select(svgEl).selectAll('*').remove()

  const svg = d3.select(svgEl)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('background', 'rgba(255,255,255,0.02)')
    .style('border', '1px solid rgba(255,255,255,0.06)')

  // Defs: arrowhead marker
  const defs = svg.append('defs')
  defs.append('marker')
    .attr('id', 'arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 22).attr('refY', 0)
    .attr('markerWidth', 6).attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', 'rgba(255,255,255,0.3)')

  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(edges).id(d => d.id).distance(100).strength(0.5))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(35))

  // Edges
  const link = svg.append('g').selectAll('line')
    .data(edges).join('line')
    .attr('stroke', d => d.suspicious ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)')
    .attr('stroke-width', d => d.suspicious ? 2 : 1)
    .attr('stroke-dasharray', d => d.suspicious ? '6 3' : null)
    .attr('marker-end', 'url(#arrow)')

  // Edge amount labels
  const edgeLabel = svg.append('g').selectAll('text')
    .data(edges.filter(e => e.amount > 0)).join('text')
    .text(d => `₹${(d.amount / 1000).toFixed(0)}K`)
    .attr('fill', '#64748b')
    .attr('font-size', 9)
    .attr('text-anchor', 'middle')
    .style('pointer-events', 'none')

  // Nodes
  const node = svg.append('g').selectAll('g')
    .data(nodes).join('g')
    .attr('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) sim.alphaTarget(0.3).restart()
        d.fx = d.x; d.fy = d.y
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
      .on('end', (event, d) => {
        if (!event.active) sim.alphaTarget(0)
        d.fx = null; d.fy = null
      })
    )

  const nodeColors = NODE_COLORS

  // Node circle with glow for highlighted nodes
  node.append('circle')
    .attr('r', d => d.highlight ? 22 : 18)
    .attr('fill', d => (nodeColors[d.type] || nodeColors.source).fill)
    .attr('stroke', d => (nodeColors[d.type] || nodeColors.source).stroke)
    .attr('stroke-width', d => d.highlight ? 3 : 1.5)
    .style('filter', d => d.highlight ? `drop-shadow(0 0 8px ${(nodeColors[d.type] || nodeColors.source).stroke})` : null)

  // Risk score ring
  node.append('circle')
    .attr('r', d => d.highlight ? 22 : 18)
    .attr('fill', 'none')
    .attr('stroke', d => {
      const r = d.risk || 0
      if (r > 0.7) return 'rgba(239,68,68,0.6)'
      if (r > 0.4) return 'rgba(245,158,11,0.5)'
      return 'rgba(16,185,129,0.4)'
    })
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', d => {
      const r = d.highlight ? 22 : 18
      const c = 2 * Math.PI * r
      return `${c * (d.risk || 0)} ${c * (1 - (d.risk || 0))}`
    })
    .attr('transform', 'rotate(-90)')

  // Node labels
  node.append('text')
    .text(d => d.label || d.id)
    .attr('text-anchor', 'middle')
    .attr('dy', 32)
    .attr('fill', d => LABEL_COLORS[d.type] || '#94a3b8')
    .attr('font-size', 10)
    .attr('font-weight', 600)

  sim.on('tick', () => {
    link
      .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x).attr('y2', d => d.target.y)

    edgeLabel
      .attr('x', d => (d.source.x + d.target.x) / 2)
      .attr('y', d => (d.source.y + d.target.y) / 2 - 5)

    node.attr('transform', d => `translate(${d.x},${d.y})`)
  })
}
