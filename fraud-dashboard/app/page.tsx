'use client'

import { useEffect, useState } from 'react'

import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import MetricCard from './components/MetricCard'
import TransactionTable from './components/TransactionTable'
import FraudCharts from './components/FraudCharts'
import AlertPanel from './components/Alerts'
import StatusBar from './components/StatusBar'

import useFraudMetrics from './hooks/useFraudMetrics'
import { API_KEY, API_BASE, API_URL } from './config'

type Transaction = {
  transaction_id: string
  user_id: string
  amount: number
  risk_score: number
  decision: string
  reasons: string[]
  timestamp: string
}

export default function Home() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([])

  const [loading, setLoading] =
    useState(true)

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

  useEffect(() => {
    fetchTransactions()

    const interval =
      setInterval(() => {
        fetchTransactions()
      }, 5000)

    return () =>
      clearInterval(interval)
  }, [])

  const metrics =
    useFraudMetrics(
      transactions
    )

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Navbar />
        <StatusBar />

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
          <MetricCard
            title="Approved"
            value={String(metrics.approved)}
          />

          <MetricCard
            title="Verification"
            value={String(
              metrics.verificationRequired
            )}
          />

          <MetricCard
            title="Under Review"
            value={String(
              metrics.underReview
            )}
          />

          <MetricCard
            title="Declined"
            value={String(
              metrics.declined
            )}
          />

          <MetricCard
            title="Fraud Rate"
            value={`${metrics.fraudRate}%`}
          />

          <MetricCard
            title="Frozen Accounts"
            value={String(
              metrics.frozenAccounts
            )}
          />
        </section>

        <FraudCharts
          transactions={
            transactions
          }
        />

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TransactionTable
              transactions={
                transactions
              }
              loading={loading}
            />
          </div>

          <AlertPanel
            transactions={
              transactions
            }
          />
        </section>
      </main>
    </div>
  )
}