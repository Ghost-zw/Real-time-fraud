'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname =
    usePathname()

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/',
    },
    {
      label: 'Transactions',
      href:
        '/transactions',
    },
    {
      label: 'Alerts',
      href: '/alerts',
    },
    {
      label: 'Analytics',
      href:
        '/analytics',
    },
  ]

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 hidden md:block">
      <h1 className="text-3xl font-bold text-cyan-400 mb-10">
        FraudGuard
      </h1>

      <nav className="space-y-4">
        {menuItems.map(
          (item) => (
            <Link
              key={
                item.href
              }
              href={
                item.href
              }
              className={`block px-4 py-3 rounded-2xl transition-all ${
                pathname ===
                item.href
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {
                item.label
              }
            </Link>
          )
        )}
      </nav>
    </aside>
  )
}