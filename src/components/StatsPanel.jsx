export default function StatsPanel({ state }) {
  const items = [
    { label: 'Visited', value: state.visited?.size ?? 0 },
    { label: 'Articulation Points', value: state.articulations?.size ?? 0 },
    { label: 'Bridges', value: state.bridges?.size ?? 0 },
    { label: 'BCC Count', value: state.bccCount ?? 0 },
  ]

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4 text-white/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((it) => (
        <div key={it.label} className="bg-white/5 rounded-lg px-3 py-2">
          <div className="text-xs uppercase tracking-widest text-white/60">{it.label}</div>
          <div className="text-lg font-semibold text-white">{it.value}</div>
        </div>
      ))}
    </div>
  )
}
