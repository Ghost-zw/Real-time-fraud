export default function StatusBar() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 mb-6 flex flex-wrap gap-6 items-center shadow-lg">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
        <span className="font-medium text-green-400">
          System Healthy
        </span>
      </div>

      <div className="text-slate-300">
        API: <span className="text-cyan-400">Online</span>
      </div>

      <div className="text-slate-300">
        Monitoring:
        <span className="text-green-400 ml-2">
          ACTIVE
        </span>
      </div>

      <div className="text-slate-300">
        Last Refresh:
        <span className="text-slate-400 ml-2">
          2s ago
        </span>
      </div>
    </div>
  )
}