import Link from 'next/link'

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 hidden md:block">
      <h1 className="text-3xl font-bold text-cyan-400 mb-8">
        FraudGuard
      </h1>

      <nav className="space-y-5 text-lg">
        <Link
          href="/"
          className="block text-cyan-400 hover:text-cyan-300"
        >
          Dashboard
        </Link>

        <Link
          href="/transactions"
          className="block text-slate-300 hover:text-white"
        >
          Transactions
        </Link>

        <Link
          href="/alerts"
          className="block text-slate-300 hover:text-white"
        >
          Alerts
        </Link>

        <Link
          href="/analytics"
          className="block text-slate-300 hover:text-white"
        >
          Analytics
        </Link>
      </nav>
    </aside>
  )
}