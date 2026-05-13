type MetricCardProps = {
  title: string
  value: string
}

export default function MetricCard({
  title,
  value,
}: MetricCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-cyan-500/30 hover:-translate-y-1 transition-all shadow-lg">
      <p className="text-slate-400">
        {title}
      </p>

      <h2 className="text-4xl font-bold mt-3">
        {value}
      </h2>
    </div>
  )
}