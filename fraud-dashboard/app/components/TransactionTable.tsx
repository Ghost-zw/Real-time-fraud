'use client'

import { useState } from 'react'
import TransactionFilters from './TransactionFilters'


type Transaction = {
  transaction_id: string
  user_id: string
  amount: number
  risk_score: number
  decision: string
  reasons: string[]
  timestamp: string
}

type Props = {
  transactions: Transaction[]
  loading: boolean
}

export default function TransactionTable({
  transactions,
  loading,
}: Props) {
 
  

  const [search, setSearch] =
    useState('')

  const [decision, setDecision] =
    useState('ALL')

  const [risk, setRisk] =
    useState('ALL')

    
   
  
  const filteredTransactions =
    transactions.filter((txn) => {
      const matchesSearch =
        txn.transaction_id
          .toLowerCase()
          .includes(
            search.toLowerCase()
          ) ||
        txn.user_id
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )

      const matchesDecision =
        decision === 'ALL' ||
        txn.decision ===
          decision

      const matchesRisk =
        risk === 'ALL' ||
        (risk === 'HIGH' &&
          txn.risk_score >= 80) ||
        (risk === 'MEDIUM' &&
          txn.risk_score >= 40 &&
          txn.risk_score < 80) ||
        (risk === 'LOW' &&
          txn.risk_score < 40)

      return (
        matchesSearch &&
        matchesDecision &&
        matchesRisk
      )
    })

  if (loading) {
    return (
      <div className="text-slate-400">
        Loading transactions...
      </div>
    )
  }

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
              <table className="w-full text-left table-fixed">
                  <thead className="bg-slate-800 text-slate-300 uppercase text-sm">
                      <tr>
                          <th className="p-4 w-[220px]">
                              Transaction ID
                          </th>

                          <th className="w-[160px]">
                              User
                          </th>

                          <th className="w-[120px]">
                              Amount
                          </th>

                          <th className="w-[120px]">
                              Risk Score
                          </th>

                          <th className="w-[150px]">
                              Decision
                          </th>

                          <th className="w-[260px]">
                              Reasons
                          </th>

                          <th className="w-[220px]">
                              Timestamp
                          </th>
                      </tr>
                  </thead>

                  <tbody>
                      {filteredTransactions.map(
                          (txn) => (
                              <tr
                                  key={txn.transaction_id}
                                  className="border-t border-slate-800 hover:bg-slate-800/40 transition-all"
                              >
                                  <td className="p-4 font-medium truncate">
                                      {txn.transaction_id}
                                  </td>

                                  <td className="truncate">
                                      {txn.user_id}
                                  </td>

                                  <td className="font-medium">
                                      ${txn.amount}
                                  </td>

                                  <td>
                                      <span className="font-semibold text-cyan-400">
                                          {txn.risk_score}
                                      </span>
                                  </td>

                                  <td>
                                      <span
                                          className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${txn.decision ===
                                                  'BLOCKED'
                                                  ? 'bg-red-500/20 text-red-400'
                                                  : txn.decision ===
                                                      'FLAGGED'
                                                      ? 'bg-yellow-500/20 text-yellow-400'
                                                      : 'bg-green-500/20 text-green-400'
                                              }`}
                                      >
                                          {txn.decision}
                                      </span>
                                  </td>

                                  <td className="text-slate-300">
                                      {txn.reasons?.join(', ')}
                                  </td>

                                  <td className="text-slate-400 text-sm whitespace-nowrap">
                                      {new Date(
                                          txn.timestamp
                                      ).toLocaleString()}
                                  </td>
                              </tr>
                          )
                      )}
                  </tbody>
              </table>
      </div>
    </section>
  )
}