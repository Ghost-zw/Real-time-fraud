export default function Navbar() {
  return (
    <header className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-5xl font-bold mb-2">
          Fraud Detection Dashboard
        </h1>

        <p className="text-slate-400 text-lg">
          Real-time fraud monitoring and analyst intelligence
        </p>
      </div>

      <div className="bg-slate-900 border border-cyan-500/20 px-5 py-3 rounded-2xl text-cyan-400 shadow-lg">
        Analyst Mode
      </div>
    </header>
  )
}