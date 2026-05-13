'use client'

import { useState } from 'react'
import { transactions } from '../data/mockData'
import TransactionFilters from './TransactionFilters'

export default function TransactionTable() {
  const [search, setSearch] = useState('')
  const [decision, setDecision] = useState('ALL')
  const [risk, setRisk] = useState('ALL')

  const filteredTransactions = transactions.filter(
    (txn) => {
      const matchesSearch =
        txn.id
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        txn.user
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesDecision =
        decision === 'ALL' ||
        txn.decision === decision

      const matchesRisk =
        risk === 'ALL' ||
        (risk === 'HIGH' &&
          txn.riskScore >= 80) ||
        (risk === 'MEDIUM' &&
          txn.riskScore >= 40 &&
          txn.riskScore < 80) ||
        (risk === 'LOW' &&
          txn.riskScore < 40)

      return (
        matchesSearch &&
        matchesDecision &&
        matchesRisk
      )
    }
  )

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-2xl font-semibold">
          Real-Time Transaction Feed
        </h2>

        <p className="text-slate-400 mt-1">
          Monitor suspicious transactions and fraud decisions.
        </p>

        <TransactionFilters
          search={search}
          setSearch={setSearch}
          decision={decision}
          setDecision={setDecision}
          risk={risk}
          setRisk={setRisk}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-800 text-slate-300 uppercase text-sm">
            <tr>
              <th className="p-4">
                Transaction ID
              </th>
              <th>User</th>
              <th>Amount</th>
              <th>Risk Score</th>
              <th>Decision</th>
              <th>Reason</th>
              <th>Time</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map((txn) => (
              <tr
                key={txn.id}
                className="border-t border-slate-800 hover:bg-slate-800/40 transition-all"
              >
                <td className="p-4 font-medium">
                  {txn.id}
                </td>

                <td>{txn.user}</td>

                <td className="font-medium">
                  {txn.amount}
                </td>

                <td>
                  {txn.riskScore}
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      txn.decision === 'BLOCKED'
                        ? 'bg-red-500/20 text-red-400'
                        : txn.decision === 'FLAGGED'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {txn.decision}
                  </span>
                </td>

                <td>{txn.reasons}</td>
                <td>{txn.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}