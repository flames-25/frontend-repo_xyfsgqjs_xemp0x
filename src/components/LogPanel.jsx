export default function LogPanel({ logs }) {
  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3 text-white/80 h-48 overflow-auto">
      <div className="text-xs uppercase tracking-widest text-white/60 mb-2">Traversal Log</div>
      <ul className="space-y-1">
        {logs.map((l, i) => (
          <li key={i} className="text-sm text-white/90">{l}</li>
        ))}
      </ul>
    </div>
  )
}
