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
  reasons?: string[]
  timestamp: string
}

const demoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE ===
  'true'

export default function AlertsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([])

  const [selectedAlert, setSelectedAlert] =
    useState<Transaction | null>(
      null
    )

  const [filter, setFilter] =
    useState('ALL')
  
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

          body: JSON.stringify({
            transaction_id:
              transactionId,

            action,
          }),
        }
      )

    const data =
      await response.json()

    console.log(data)

    await fetchAlerts()

    setSelectedAlert(null)

  } catch (error) {

    console.error(
      'Action failed',
      error
    )
  }
}

  async function fetchAlerts() {
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

      const alerts =
        (
          data.transactions ||
          []
        ).filter(
          (
            txn: Transaction
          ) =>
            txn.decision ===
            'UNDER_REVIEW' ||

            txn.decision ===
            'DECLINED' ||

            txn.decision ===
            'VERIFICATION_REQUIRED'
        )

      setTransactions(alerts)
    } catch (error) {
      console.error(
        'Failed to fetch alerts',
        error
      )
    }
  }

  useEffect(() => {
    fetchAlerts()

    const interval =
      setInterval(
        fetchAlerts,
        5000
      )

    return () =>
      clearInterval(interval)
  }, [])

  const filteredAlerts =
    transactions.filter(
      (txn) => {
        if (
          filter === 'ALL'
        )
          return true

        return (
          txn.decision ===
          filter
        )
      }
    )

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Navbar />
        {demoMode && <DemoBanner />}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Fraud Alerts
          </h1>

          <p className="text-slate-400">
            Monitor suspicious
            fraud activity in
            real time
          </p>
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT SIDE */}
          <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">

            <div className="p-6 border-b border-slate-800 flex justify-between">
              <h2 className="text-2xl font-semibold">
                Live Alert Queue
              </h2>

              <select
                value={filter}
                onChange={(e) =>
                  setFilter(
                    e.target.value
                  )
                }
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2"
              >
                <option value="ALL">
                  All Alerts
                </option>

                <option value="UNDER_REVIEW">
                  Under Review
                </option>

                <option value="DECLINED">
                  Declined
                </option>

                <option value="VERIFICATION_REQUIRED">
                  Verification Required
                </option>
              </select>
            </div>

            <div className="space-y-4 p-5">
              {filteredAlerts.map(
                (txn) => (
                  <div
                    key={
                      txn.transaction_id
                    }
                    onClick={() =>
                      setSelectedAlert(
                        txn
                      )
                    }
                    className="bg-slate-800 border border-slate-700 rounded-3xl p-4 hover:border-cyan-500/20 cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span
                        className={`font-bold text-lg ${txn.decision ===
                            'DECLINED'
                            ? 'text-red-400'

                            : txn.decision ===
                              'UNDER_REVIEW'
                              ? 'text-orange-400'

                              : 'text-yellow-400'
                          }`}
                      >
                        {txn.decision.replaceAll(
                          '_',
                          ' '
                        )}
                      </span>

                      <span className="text-slate-400 text-sm">
                        {new Date(
                          txn.timestamp
                        ).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-lg font-medium">
                      {
                        txn.user_id
                      }
                    </p>

                    <p className="text-slate-300">
                      $
                      {
                        txn.amount
                      }
                    </p>

                    <p className="text-cyan-400 text-sm mt-2">
                      Risk Score:{' '}
                      {
                        txn.risk_score
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-2xl font-semibold mb-5">
              Investigation
            </h2>

            {selectedAlert ? (
              <div className="space-y-5">

                <div>
                  <p className="text-slate-400 text-sm">
                    Transaction ID
                  </p>

                  <p>
                    {selectedAlert.transaction_id}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    User
                  </p>

                  <p>
                    {selectedAlert.user_id}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Decision
                  </p>

                  <p
                    className={`font-semibold ${selectedAlert.decision ===
                        'DECLINED'
                        ? 'text-red-400'

                        : selectedAlert.decision ===
                          'UNDER_REVIEW'
                          ? 'text-orange-400'

                          : 'text-yellow-400'
                      }`}
                  >
                    {selectedAlert.decision.replaceAll(
                      '_',
                      ' '
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 text-sm">
                    Reasons
                  </p>

                  <p>
                    {selectedAlert.reasons?.join(
                      ', '
                    ) ||
                      'No reason provided'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">

                  {selectedAlert.decision ===
                    'UNDER_REVIEW' && (
                      <>
                        <button
                          onClick={() =>
                            handleAction(
                              selectedAlert.transaction_id,
                              'APPROVE'
                            )
                          }
                          className="bg-green-500/20 text-green-400 rounded-xl py-3 hover:bg-green-500/30 transition"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            handleAction(
                              selectedAlert.transaction_id,
                              'DECLINE'
                            )
                          }
                          className="bg-yellow-500/20 text-yellow-400 rounded-xl py-3 hover:bg-yellow-500/30 transition"
                        >
                          Decline
                        </button>

                      <button
                        disabled={demoMode}
                        onClick={() =>
                          !demoMode &&
                          handleAction(
                            selectedAlert.transaction_id,
                            'DECLINE'
                          )
                        }
                        className={`rounded-xl py-3 transition ${demoMode
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          }`}
                      >
                        Decline
                      </button>
                      </>
                    )}

                  {selectedAlert.decision ===
                    'VERIFICATION_REQUIRED' && (
                      <div className="col-span-2 bg-slate-800 rounded-2xl p-4 text-center text-slate-400">
                        Awaiting customer verification
                      </div>
                    )}

                  {selectedAlert.decision ===
                    'DECLINED' && (
                      <div className="col-span-2 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center text-red-400">
                        Automatically declined by fraud engine
                      </div>
                    )}

                </div>
              </div>
            ) : (
              <p className="text-slate-400">
                Select an alert to investigate
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}