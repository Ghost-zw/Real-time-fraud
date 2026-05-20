'use client'
import MetricCard from '../components/MetricCard'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from 'recharts'

import {
  useEffect,
  useState,
} from 'react'

import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import {
  API_KEY,
  API_URL,
} from '../config'

type Transaction = {
  transaction_id: string
  user_id: string
  amount: number
  risk_score: number
  decision: string
  timestamp: string
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>([])

  async function fetchAnalytics() {
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
    }
  }

  useEffect(() => {
    fetchAnalytics()

    const interval =
      setInterval(
        fetchAnalytics,
        5000
      )

    return () =>
      clearInterval(interval)
  }, [])

  const approved =
    transactions.filter(
      (t) =>
        t.decision ===
        'APPROVED'
    ).length

  const flagged =
    transactions.filter(
      (t) =>
        t.decision ===
        'FLAGGED'
    ).length

  const blocked =
    transactions.filter(
      (t) =>
        t.decision ===
        'BLOCKED'
    ).length

  const fraudRate =
    transactions.length > 0
      ? (
          ((flagged +
            blocked) /
            transactions.length) *
          100
        ).toFixed(1)
      : '0'

  const averageRisk =
    transactions.length > 0
      ? (
          transactions.reduce(
            (
              sum,
              txn
            ) =>
              sum +
              txn.risk_score,
            0
          ) /
          transactions.length
        ).toFixed(1)
      : '0'

  const totalAmount =
    transactions.reduce(
      (
        sum,
        txn
      ) =>
        sum +
        txn.amount,
      0
    )

  const decisionData = [
    {
      name: 'Approved',
      value: approved,
    },
    {
      name: 'Flagged',
      value: flagged,
    },
    {
      name: 'Blocked',
      value: blocked,
    },
  ]

  const riskData = [
    {
      name: 'High',
      value:
        transactions.filter(
          (t) =>
            t.risk_score >=
            70
        ).length,
    },
    {
      name: 'Medium',
      value:
        transactions.filter(
          (t) =>
            t.risk_score >=
              40 &&
            t.risk_score <
              70
        ).length,
    },
    {
      name: 'Low',
      value:
        transactions.filter(
          (t) =>
            t.risk_score <
            40
        ).length,
    },
  ]

  const trendData =
    transactions.reduce(
      (
        acc,
        txn
      ) => {
  const date =
  new Date(
    txn.timestamp
  )

const hour =
  isNaN(
    date.getTime()
  )
    ? 'Unknown'
    : date.getHours()

const label =
  `${hour}:00`

        const existing =
          acc.find(
            (
              item
            ) =>
              item.time ===
              label
          )

        if (existing) {
          existing.count += 1
        } else {
          acc.push({
            time:
              label,
            count: 1,
          })
        }

        return acc
      },
      [] as {
        time: string
        count: number
      }[]
    )

  const topUsers =
    Object.entries(
      transactions.reduce(
        (
          acc,
          txn
        ) => {
          acc[
            txn.user_id
          ] =
            (
              acc[
                txn.user_id
              ] || 0
            ) + 1

          return acc
        },
        {} as Record<
          string,
          number
        >
      )
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      )
      .slice(0, 5)

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <Navbar />

        <h1 className="text-4xl font-bold mb-8">
          Analytics
        </h1>

        {/* KPI */}
        <section className="grid grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
          <MetricCard
            title="Transactions"
            value={String(
              transactions.length
            )}
          />

          <MetricCard
            title="Fraud Rate"
            value={`${fraudRate}%`}
          />

          <MetricCard
            title="Avg Risk"
            value={averageRisk}
          />

          <MetricCard
            title="Flagged + Blocked"
            value={String(
              flagged +
                blocked
            )}
          />

          <MetricCard
            title="Money Monitored"
            value={`$${totalAmount}`}
          />
        </section>

        {/* CHARTS */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-900 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-5">
              Decision Breakdown
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <PieChart>
                <Pie
                  data={
                    decisionData
                  }
                  dataKey="value"
                  outerRadius={100}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#facc15" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
              <Legend />
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-5">
              Fraud Trend
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <LineChart
                data={
                  trendData
                }
              >
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#06b6d4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Risk + Users */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-5">
              Risk Distribution
            </h2>

            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart
                data={riskData}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="#06b6d4"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6">
            <h2 className="text-xl font-semibold mb-5">
              Top Risk Users
            </h2>

            <div className="space-y-4">
              {topUsers.map(
                (
                  user
                ) => (
                  <div
                    key={
                      user[0]
                    }
                    className="flex justify-between border-b border-slate-800 pb-3"
                  >
                    <span>
                      {
                        user[0]
                      }
                    </span>

                    <span className="text-cyan-400 font-semibold">
                      {
                        user[1]
                      }{' '}
                      txns
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}