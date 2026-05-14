'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

type Transaction = {
  decision: string
  timestamp: string
}

type Props = {
  transactions: Transaction[]
}

export default function FraudCharts({
  transactions,
}: Props) {
  // LIVE Decision Breakdown
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

  // LIVE Fraud Trend
  const groupedData =
    transactions.reduce(
      (acc, txn) => {
        const hour =
          new Date(
            txn.timestamp
          ).getHours()

        const label =
          `${hour}:00`

        const existing =
          acc.find(
            (item) =>
              item.time ===
              label
          )

        if (existing) {
          existing.fraud += 1
        } else {
          acc.push({
            time: label,
            fraud: 1,
          })
        }

        return acc
      },
      [] as {
        time: string
        fraud: number
      }[]
    )

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-5">
          Decision Breakdown
        </h2>

        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <PieChart>
            <Pie
              data={decisionData}
              dataKey="value"
              outerRadius={120}
            >
              <Cell fill="#10b981" />
              <Cell fill="#facc15" />
              <Cell fill="#ef4444" />
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
        <h2 className="text-2xl font-semibold mb-5">
          Fraud Trend
        </h2>

        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <LineChart
            data={groupedData}
          >
            <XAxis
              dataKey="time"
            />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="fraud"
              stroke="#06b6d4"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}