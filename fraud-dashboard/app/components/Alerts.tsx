const alerts = [
  {
    level: 'BLOCKED',
    user: 'user_secure',
    amount: '$1500',
    reason: 'Velocity threshold exceeded',
    risk: 110,
    time: '14:20',
  },
  {
    level: 'FLAGGED',
    user: 'user_123',
    amount: '$750',
    reason: 'Behavior anomaly',
    risk: 45,
    time: '14:15',
  },
]

export default function AlertPanel() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg h-fit">
      <h2 className="text-2xl font-semibold mb-5">
        Live Fraud Alerts
      </h2>

      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-cyan-500/20 transition-all"
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className={`font-bold ${
                  alert.level === 'BLOCKED'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                }`}
              >
                {alert.level}
              </span>

              <span className="text-slate-400 text-sm">
                {alert.time}
              </span>
            </div>

            <p className="font-medium text-lg">
              {alert.user}
            </p>

            <p className="text-slate-300 mt-1">
              {alert.amount}
            </p>

            <p className="text-slate-400 text-sm mt-2">
              {alert.reason}
            </p>

            <div className="mt-3 text-sm text-cyan-400">
              Risk Score: {alert.risk}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}