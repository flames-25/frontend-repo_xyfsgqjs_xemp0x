import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ControlBar from './components/ControlBar'
import GraphCanvas from './components/GraphCanvas'
import StatsPanel from './components/StatsPanel'
import LogPanel from './components/LogPanel'

// Utility: random graph generator (simple, undirected, no self-loops, no duplicates)
function generateGraph(n, m) {
  const nodes = Array.from({ length: n }, (_, i) => i)
  const edges = new Set()
  const key = (u, v) => (u < v ? `${u}-${v}` : `${v}-${u}`)
  let attempts = 0
  while (edges.size < m && attempts < m * 10) {
    attempts++
    const u = Math.floor(Math.random() * n)
    const v = Math.floor(Math.random() * n)
    if (u === v) continue
    edges.add(key(u, v))
  }
  const edgeArr = Array.from(edges).map((s) => s.split('-').map(Number))
  return { nodes, edges: edgeArr }
}

// Force-directed like initial positions
function initialPositions(n, width, height) {
  const cx = width / 2
  const cy = height / 2
  const r = Math.min(width, height) * 0.35
  const pos = {}
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2
    pos[i] = {
      x: cx + r * Math.cos(ang) + (Math.random() - 0.5) * 30,
      y: cy + r * Math.sin(ang) + (Math.random() - 0.5) * 30,
    }
  }
  return pos
}

// Tarjan's algorithm with step capture for DFS traversal and BCC detection
function tarjanWithSteps(graph) {
  const n = graph.nodes.length
  const disc = Array(n).fill(-1)
  const low = Array(n).fill(-1)
  const parent = Array(n).fill(-1)
  const visited = new Set()
  const articulations = new Set()
  const bridges = new Set() // store as "u-v" with u<v
  const timeRef = { v: 0 }
  const adj = Array.from({ length: n }, () => [])
  graph.edges.forEach(([u, v]) => {
    adj[u].push(v)
    adj[v].push(u)
  })

  const stack = [] // for BCC edges
  const bccs = [] // array of arrays of edges
  const steps = []

  function pushStep(extra = {}) {
    steps.push({
      disc: [...disc],
      low: [...low],
      parent: [...parent],
      visited: new Set(visited),
      articulations: new Set(articulations),
      bridges: new Set(bridges),
      current: extra.current ?? null,
      event: extra.event ?? '',
      bccs: bccs.map((c) => c.map(([a, b]) => [a, b])),
    })
  }

  function addBridge(u, v) {
    const k = u < v ? `${u}-${v}` : `${v}-${u}`
    bridges.add(k)
  }

  function extractBCC(u, v) {
    const comp = []
    while (stack.length) {
      const e = stack.pop()
      comp.push(e)
      if ((e[0] === u && e[1] === v) || (e[0] === v && e[1] === u)) break
    }
    if (comp.length) bccs.push(comp)
  }

  function dfs(u, isRoot) {
    visited.add(u)
    disc[u] = low[u] = timeRef.v++
    pushStep({ current: u, event: `Visit ${u}` })

    let childCount = 0

    for (const v of adj[u]) {
      if (disc[v] === -1) {
        parent[v] = u
        stack.push([u, v])
        childCount++
        pushStep({ current: u, event: `Tree edge ${u}-${v}` })
        dfs(v, false)
        low[u] = Math.min(low[u], low[v])
        pushStep({ current: u, event: `Post DFS update low[${u}]` })

        if (!isRoot && low[v] >= disc[u]) {
          articulations.add(u)
          pushStep({ current: u, event: `${u} is articulation` })
          extractBCC(u, v)
        }
        if (low[v] > disc[u]) {
          addBridge(u, v)
          pushStep({ current: u, event: `Bridge ${u}-${v}` })
        }
      } else if (v !== parent[u] && disc[v] < disc[u]) {
        // Back edge
        low[u] = Math.min(low[u], disc[v])
        stack.push([u, v])
        pushStep({ current: u, event: `Back edge ${u}-${v}` })
      }
    }

    if (isRoot && childCount > 1) {
      articulations.add(u)
      pushStep({ current: u, event: `${u} is root articulation` })
    }
  }

  for (let i = 0; i < n; i++) {
    if (disc[i] === -1) {
      dfs(i, true)
      if (stack.length) extractBCC(-1, -1)
    }
  }

  // Convert BCCs to polygons for soft background tinting
  const colorPalette = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#f59e0b']
  const bccPolygons = bccs.map((edges, idx) => {
    const nodes = new Set()
    edges.forEach(([a, b]) => { nodes.add(a); nodes.add(b) })
    return { nodes: [...nodes], color: colorPalette[idx % colorPalette.length] }
  })

  return { steps, bccs, bccPolygonsInitial: bccPolygons }
}

export default function App() {
  const [graph, setGraph] = useState(() => generateGraph(8, 10))
  const [positions, setPositions] = useState(() => initialPositions(8, 1200, 700))
  const tarjan = useMemo(() => tarjanWithSteps(graph), [graph])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [logs, setLogs] = useState([])
  const timerRef = useRef(null)

  const state = useMemo(() => {
    const base = tarjan.steps[idx] || tarjan.steps[tarjan.steps.length - 1] || {}
    const bccCount = base?.bccs?.length || 0

    // Build soft polygon paths (convex hull-like) for each BCC using current positions
    const bccPolygons = (tarjan.bccPolygonsInitial || []).map((c) => {
      const pts = c.nodes.map((id) => positions[id])
      if (pts.length < 3) return { d: '', color: c.color }
      // Simple radial sort
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length
      pts.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
      return { d, color: c.color }
    })

    return {
      ...base,
      bccCount,
      bccPolygons,
      tooltipNode: null,
    }
  }, [idx, tarjan, positions])

  useEffect(() => {
    if (!playing) return
    timerRef.current = setInterval(() => {
      setIdx((i) => Math.min(i + 1, tarjan.steps.length - 1))
    }, 900)
    return () => clearInterval(timerRef.current)
  }, [playing, tarjan.steps.length])

  useEffect(() => {
    const s = tarjan.steps[idx]
    if (s?.event) setLogs((prev) => [...prev.slice(-200), s.event])
  }, [idx, tarjan.steps])

  const handleGenerate = useCallback((n, m) => {
    const g = generateGraph(n, m)
    setGraph(g)
    setPositions(initialPositions(n, 1200, 700))
    setIdx(0)
    setPlaying(false)
    setLogs([])
  }, [])

  const onPrev = () => setIdx((i) => Math.max(0, i - 1))
  const onNext = () => setIdx((i) => Math.min(tarjan.steps.length - 1, i + 1))
  const onReset = () => setPositions(initialPositions(graph.nodes.length, 1200, 700))

  const [hoverNode, setHoverNode] = useState(null)

  const exportPNG = () => {
    const svgEl = document.querySelector('svg')
    if (!svgEl) return
    const ser = new XMLSerializer()
    const svgStr = ser.serializeToString(svgEl)
    const img = new Image()
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = svgEl.clientWidth
      canvas.height = svgEl.clientHeight
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#0b1020'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob((png) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(png)
        a.download = 'tarjan-visualizer.png'
        a.click()
      })
    }
    img.src = url
  }

  return (
    <div className="min-h-screen w-full bg-[#060a17] text-white selection:bg-cyan-500/30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-fuchsia-500/10 blur-3xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4 relative">
        <ControlBar
          onGenerate={handleGenerate}
          onPlayToggle={() => setPlaying((p) => !p)}
          playing={playing}
          onPrev={onPrev}
          onNext={onNext}
          onReset={onReset}
          onExport={exportPNG}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2">
            <GraphCanvas
              graph={graph}
              positions={{ ...positions }}
              state={{ ...state, tooltipNode: hoverNode }}
              onNodeHover={setHoverNode}
            />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <StatsPanel state={{ ...state }} />
            <LogPanel logs={logs} />
          </div>
        </div>

        <div className="text-center text-white/60 text-sm">
          Tarjan Visualizer — modern neon edition. Hover nodes to view disc/low; bridges glow red; components softly tinted.
        </div>
      </div>
    </div>
  )
}
