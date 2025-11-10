import { useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Download } from 'lucide-react'

export default function ControlBar({
  onGenerate,
  onPlayToggle,
  playing,
  onPrev,
  onNext,
  onReset,
  onExport,
}) {
  const [nodes, setNodes] = useState(8)
  const [edges, setEdges] = useState(10)

  return (
    <div className="w-full backdrop-blur-md bg-[#0b1020]/60 border border-white/10 shadow-lg rounded-xl px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-2 text-white/80">
        <label className="text-xs uppercase tracking-wider">Nodes</label>
        <input
          type="number"
          min={1}
          max={40}
          value={nodes}
          onChange={(e) => setNodes(parseInt(e.target.value || '0'))}
          className="w-16 bg-white/10 text-white rounded-md px-2 py-1 outline-none focus:ring-2 ring-cyan-400/60"
        />
        <label className="text-xs uppercase tracking-wider">Edges</label>
        <input
          type="number"
          min={0}
          max={200}
          value={edges}
          onChange={(e) => setEdges(parseInt(e.target.value || '0'))}
          className="w-20 bg-white/10 text-white rounded-md px-2 py-1 outline-none focus:ring-2 ring-cyan-400/60"
        />
        <button
          onClick={() => onGenerate(Math.max(1, nodes), Math.max(0, edges))}
          className="ml-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-md px-3 py-1.5 transition-colors"
        >
          Generate
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="p-2 rounded-md bg-white/10 hover:bg-white/15 text-white transition-colors"
          title="Previous step"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={onPlayToggle}
          className="px-3 py-2 rounded-md bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-black font-semibold hover:opacity-90 transition"
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? <div className="flex items-center gap-2"><Pause size={16}/> Pause</div> : <div className="flex items-center gap-2"><Play size={16}/> Play</div>}
        </button>
        <button
          onClick={onNext}
          className="p-2 rounded-md bg-white/10 hover:bg-white/15 text-white transition-colors"
          title="Next step"
        >
          <SkipForward size={18} />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button
          onClick={onReset}
          className="p-2 rounded-md bg-white/10 hover:bg-white/15 text-white transition-colors"
          title="Restart layout"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={onExport}
          className="p-2 rounded-md bg-white/10 hover:bg-white/15 text-white transition-colors"
          title="Export PNG"
        >
          <Download size={18} />
        </button>
      </div>
    </div>
  )
}
