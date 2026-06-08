'use client'

import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import DemoBanner from '../components/DemoBanner'
import { API_KEY, API_BASE, API_URL } from '../config'

type Transaction = {
  transaction_id: string
  user_id: string
  amount: number
  risk_score: number
  decision: string
  reasons: string[]
  timestamp: string
  account_status?: string
  review_status?: string
  reviewed_by?: string
  reviewed_at?: string
  action_taken?: string
}

const demoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE ===
  'true'

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([])

  const [loading, setLoading] =
    useState(true)

  const [selectedTxn, setSelectedTxn] =
    useState<Transaction | null>(
      null
    )

const [search, setSearch] =
  useState('')

const [decision, setDecision] =
  useState('ALL')

const [riskFilter, setRiskFilter] =
  useState('ALL')

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
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
async function handleAction(
  transactionId: string,
  action: string
) {
  try {

    const response =
      await fetch(
        `${API_BASE}/transaction-action`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'x-api-key':
              API_KEY,
          },

          body:
          JSON.stringify({
            transaction_id:
              transactionId,

            action,
          }),
        }
      )

    const data =
      await response.json()

    console.log(data)

    // fetch fresh data
    const refreshedResponse =
      await fetch(
        API_URL,
        {
          headers: {
            'x-api-key':
              API_KEY,
          },
        }
      )

    const refreshedData =
      await refreshedResponse.json()

    const updatedTransactions =
      refreshedData
        .transactions || []

    setTransactions(
      updatedTransactions
    )

    // instantly refresh panel
    const updatedTxn =
      updatedTransactions.find(
        (
          txn: Transaction
        ) =>
          txn.transaction_id ===
          transactionId
      )

    if (updatedTxn) {

      setSelectedTxn(
        updatedTxn
      )
    }

  } catch (error) {

    console.error(
      'Action failed',
      error
    )
  }
}

  useEffect(() => {
    fetchTransactions()

    const interval =
      setInterval(
        fetchTransactions,
        5000
      )

    return () =>
      clearInterval(interval)
  }, [])

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
      riskFilter ===
        'ALL' ||
      (riskFilter ===
        'HIGH' &&
        txn.risk_score >=
          70) ||
      (riskFilter ===
        'MEDIUM' &&
        txn.risk_score >=
          40 &&
        txn.risk_score <
          70) ||
      (riskFilter ===
        'LOW' &&
        txn.risk_score <
          40)

    return (
      matchesSearch &&
      matchesDecision &&
      matchesRisk
    )
  })

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Navbar />
        {demoMode && <DemoBanner />}

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Transactions
          </h1>

          <p className="text-slate-400">
            Investigate and monitor
            real-time fraud
            transactions
          </p>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">

            <div className="p-6 border-b border-slate-800 flex gap-4 flex-wrap">
              <input
                type="text"
                placeholder="Search transaction or user..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex-1 outline-none"
              />

              <select
                value={decision}
                onChange={(e) =>
                  setDecision(
                    e.target.value
                  )
                }
                className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3"
              >
                <option value="ALL">
                  All Decisions
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="VERIFICATION_REQUIRED">
                  Verification Required
                </option>

                <option value="UNDER_REVIEW">
                  Under Review
                </option>

                <option value="DECLINED">
                  Declined
                </option>

                <option value="MANUALLY_APPROVED">
                  Manually Approved
                </option>
              </select>
              <select
                value={riskFilter}
                onChange={(e) =>
                  setRiskFilter(
                    e.target.value
                  )
                }
                className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3"
              >
                <option value="ALL">
                  All Risk Levels
                </option>

                <option value="HIGH">
                  High Risk
                </option>

                <option value="MEDIUM">
                  Medium Risk
                </option>

                <option value="LOW">
                  Low Risk
                </option>
              </select>

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
                    <th>Risk</th>
                    <th>Decision</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (txn) => (
                      <tr
                        key={
                          txn.transaction_id
                        }
                        onClick={() =>
                          setSelectedTxn(
                            txn
                          )
                        }
                        className="border-t border-slate-800 hover:bg-slate-800/40 cursor-pointer transition"
                      >
                        <td className="p-4">
                          {
                            txn.transaction_id
                          }
                        </td>

                        <td>
                          {
                            txn.user_id
                          }
                        </td>

                        <td>
                          $
                          {txn.amount}
                        </td>

                        <td>
                          <span
                            className={`font-semibold ${txn.risk_score >= 70
                                ? 'text-red-400'
                                : txn.risk_score >=
                                  40
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}
                          >
                            {txn.risk_score}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${txn.decision ===
                                'DECLINED'
                                ? 'bg-red-500/20 text-red-400'

                                : txn.decision ===
                                  'UNDER_REVIEW'
                                  ? 'bg-orange-500/20 text-orange-400'

                                  : txn.decision ===
                                    'VERIFICATION_REQUIRED'
                                    ? 'bg-yellow-500/20 text-yellow-400'

                                    : txn.decision ===
                                      'MANUALLY_APPROVED'
                                      ? 'bg-cyan-500/20 text-cyan-400'

                                      : 'bg-green-500/20 text-green-400'
                              }`}
                          >
                            {
                              txn.decision
                            }
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-semibold mb-5">
              Investigation Panel
            </h2>

            {selectedTxn ? (
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm">
                    Transaction ID
                  </p>

                  <p className="font-medium">
                    {
                      selectedTxn.transaction_id
                    }
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    User
                  </p>

                  <p>
                    {
                      selectedTxn.user_id
                    }
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Amount
                  </p>

                  <p>
                    $
                    {
                      selectedTxn.amount
                    }
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Risk Score
                  </p>

                  <p className="text-cyan-400 font-semibold">
                    {
                      selectedTxn.risk_score
                    }
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Severity
                  </p>


                  <p
                    className={`font-semibold ${selectedTxn.risk_score >=
                        70
                        ? 'text-red-400'
                        : selectedTxn.risk_score >=
                          40
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                  >
                    {selectedTxn.risk_score >=
                      70
                      ? 'HIGH'
                      : selectedTxn.risk_score >=
                        40
                        ? 'MEDIUM'
                        : 'LOW'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Account Status
                  </p>

                  <p
                    className={`font-semibold ${selectedTxn.account_status ===
                        'FROZEN'
                        ? 'text-red-400'
                        : 'text-green-400'
                      }`}
                  >
                    {selectedTxn.account_status ||
                      'ACTIVE'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Review Status
                  </p>

                  <p className="font-medium text-cyan-400">
                    {selectedTxn.review_status ||
                      'PENDING'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Reviewed By
                  </p>

                  <p>
                    {selectedTxn.reviewed_by ||
                      'Not reviewed'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Last Action
                  </p>

                  <p className="text-yellow-400">
                    {selectedTxn.action_taken ||
                      'None'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Reasons
                  </p>

                  <p>
                    {selectedTxn.reasons?.join(
                      ', '
                    ) || 'No reason provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    disabled={demoMode}
                    onClick={() =>
                      !demoMode &&
                      handleAction(
                        selectedTxn.transaction_id,
                        'APPROVE'
                      )
                    }
                    className={`px-4 py-2 rounded-xl font-medium ${demoMode
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                      }`}
                  >
                    Approve
</button>

                  <button
                    disabled={demoMode}
                    onClick={() =>
                      !demoMode &&
                      selectedTxn &&
                      handleAction(
                        selectedTxn.transaction_id,
                        selectedTxn.account_status === 'FROZEN'
                          ? 'UNFREEZE'
                          : 'FREEZE'
                      )
                    }
                    className={`px-4 py-2 rounded-xl font-medium ${demoMode
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : selectedTxn?.account_status === 'FROZEN'
                          ? 'bg-cyan-600 hover:bg-cyan-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {demoMode
                      ? 'Demo Mode'
                      : selectedTxn?.account_status === 'FROZEN'
                        ? 'Unfreeze'
                        : 'Freeze'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">
                Select a transaction to investigate
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}