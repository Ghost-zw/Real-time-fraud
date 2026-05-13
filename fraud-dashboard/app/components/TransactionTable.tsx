'use client'

import { useEffect, useState } from 'react'
import TransactionFilters from './TransactionFilters'
import { API_URL, API_KEY } from '../config'

type Transaction = {
  transaction_id: string
  user_id: string
  amount: number
  risk_score: number
  decision: string
  reasons: string[]
  timestamp: string
}

export default function TransactionTable() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([])

  const [loading, setLoading] =
    useState(true)

  const [search, setSearch] =
    useState('')

  const [decision, setDecision] =
    useState('ALL')

  const [risk, setRisk] =
    useState('ALL')

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    try {
      const response = await fetch(
        API_URL,
        {
          headers: {
            'x-api-key': API_KEY,
          },
        }
      )

      const data =
        await response.json()

      setTransactions(
        data.transactions || []
      )
    } catch (error) {
      console.error(
        'Failed to fetch transactions',
        error
      )
    } finally {
      setLoading(false)
    }
  }

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
              <th>Reasons</th>
              <th>Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map(
              (txn) => (
                <tr
                  key={
                    txn.transaction_id
                  }
                  className="border-t border-slate-800 hover:bg-slate-800/40 transition-all"
                >
                  <td className="p-4">
                    {
                      txn.transaction_id
                    }
                  </td>

                  <td>
                    {txn.user_id}
                  </td>

                  <td>
                    ${txn.amount}
                  </td>

                  <td>
                    {
                      txn.risk_score
                    }
                  </td>

                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        txn.decision ===
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

                  <td>
                    {txn.reasons?.join(
                      ', '
                    )}
                  </td>

                  <td>
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