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

const decisionData = [
  { name: 'Approved', value: 240 },
  { name: 'Flagged', value: 19 },
  { name: 'Blocked', value: 7 },
]

const fraudTrendData = [
  { time: '10AM', fraud: 2 },
  { time: '11AM', fraud: 5 },
  { time: '12PM', fraud: 4 },
  { time: '1PM', fraud: 8 },
  { time: '2PM', fraud: 6 },
]

export default function FraudCharts() {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
      {/* Decision Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg hover:border-cyan-500/20 transition-all">
        <h2 className="text-2xl font-semibold mb-5">
          Decision Breakdown
        </h2>

        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={decisionData}
              dataKey="value"
              outerRadius={100}
            >
              <Cell fill="#10b981" />
              <Cell fill="#facc15" />
              <Cell fill="#ef4444" />
            </Pie>

            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Fraud Trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg hover:border-cyan-500/20 transition-all">
        <h2 className="text-2xl font-semibold mb-5">
          Fraud Trend
        </h2>

        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={fraudTrendData}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />

            <Line
              type="monotone"
              dataKey="fraud"
              stroke="#06b6d4"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}