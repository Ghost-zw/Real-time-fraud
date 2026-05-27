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
  account_status?: string
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

    const decisionStyles = {
        APPROVED:
          'bg-green-500/20 text-green-400',

        VERIFICATION_REQUIRED:
          'bg-yellow-500/20 text-yellow-400',

        UNDER_REVIEW:
          'bg-orange-500/20 text-orange-400',

        DECLINED:
          'bg-red-500/20 text-red-400',

        MANUALLY_APPROVED:
          'bg-cyan-500/20 text-cyan-400'
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

                          <th className="w-[240px]">
                            Decision
                          </th>

                          <th className="w-[160px]">
                            Status
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
                                  className="border-t border-slate-800 hover:bg-slate-800/40 transition-all h-[78px]"
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
                                className={`inline-flex items-center justify-center min-w-[170px] px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap ${decisionStyles[
                                  txn.decision as keyof typeof decisionStyles
                                  ] ||
                                  'bg-slate-500/20 text-slate-400'
                                  }`}
                              >
                                {txn.decision.replaceAll(
                                  '_',
                                  ' '
                                )}
                              </span>
                                  </td>

                            <td>
                              {txn.account_status ===
                                'FROZEN' ? (
                                <span className="inline-flex items-center justify-center min-w-[100px] bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-xs font-semibold">
                                  FROZEN
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center min-w-[100px] bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-xs font-semibold">
                                  ACTIVE
                                </span>
                              )}
                            </td>

                            <td className="text-slate-300 max-w-[260px]">
                              <p className="truncate">
                                {txn.reasons?.join(', ')}
                              </p>
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