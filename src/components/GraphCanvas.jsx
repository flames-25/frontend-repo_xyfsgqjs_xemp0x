import { useEffect, useRef } from 'react'

// SVG-based graph renderer with glow/curved edges and node tooltips
export default function GraphCanvas({ graph, positions, state, onNodeHover, width = 1200, height = 700 }) {
  const svgRef = useRef(null)

  // Helpers
  const getNodeColor = (id) => {
    if (state.articulations?.has(id)) return '#ff6b6b'
    if (state.visited?.has(id)) return '#22d3ee'
    return '#8b9dbb'
  }

  const getNodeGlow = (id) => (state.current === id ? '0 0 20px #a78bfa' : '0 0 12px rgba(34,211,238,0.8)')

  const edgeInBridge = (u, v) => {
    const key = u < v ? `${u}-${v}` : `${v}-${u}`
    return state.bridges?.has(key)
  }

  // Path for smooth curved edge using quadratic Bezier
  const qPath = (x1, y1, x2, y2, bend = 0.08) => {
    const dx = x2 - x1
    const dy = y2 - y1
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2
    const nx = -dy
    const ny = dx
    const len = Math.hypot(dx, dy) || 1
    const cx = mx + (nx / len) * bend * len
    const cy = my + (ny / len) * bend * len
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
  }

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
  }, [graph, positions, state])

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} width={width} height={height} className="w-full h-full">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* BCC background fills */}
        {state.bccPolygons?.map((poly, i) => (
          <path key={`poly-${i}`} d={poly.d} fill={poly.color} opacity="0.12" />
        ))}

        {/* Edges */}
        {graph.edges.map(([u, v], i) => {
          const a = positions[u]
          const b = positions[v]
          const d = qPath(a.x, a.y, b.x, b.y)
          const stroke = edgeInBridge(u, v) ? '#ff6b6b' : 'url(#edgeGradient)'
          return (
            <g key={`e-${i}`}>
              <path d={d} strokeWidth={edgeInBridge(u, v) ? 3.5 : 2.2} stroke={stroke} fill="none" opacity={0.9}
                style={{ filter: 'url(#glow)' }} />
            </g>
          )
        })}

        <defs>
          <linearGradient id="edgeGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>

        {/* Nodes */}
        {graph.nodes.map((id) => {
          const p = positions[id]
          const r = state.current === id ? 13 : 10
          const color = getNodeColor(id)
          return (
            <g key={`n-${id}`}
               onMouseEnter={() => onNodeHover(id)}
               onMouseLeave={() => onNodeHover(null)}>
              <circle cx={p.x} cy={p.y} r={r} fill={color} opacity={0.95}
                      style={{ filter: 'url(#glow)' }} />
              <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="10" fill="#0b1020" fontWeight="700">
                {id}
              </text>
              {state.tooltipNode === id && (
                <g transform={`translate(${p.x + 14}, ${p.y - 10})`}>
                  <rect rx="8" ry="8" width="120" height="42" fill="#0b1020" opacity="0.85" stroke="#22d3ee" />
                  <text x="8" y="18" fontSize="11" fill="#e2e8f0">disc: {state.disc[id] ?? '-'} low: {state.low[id] ?? '-'}</text>
                  <text x="8" y="32" fontSize="11" fill="#94a3b8">parent: {state.parent[id] ?? '-'}</text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
