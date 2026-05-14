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
}

export default function AlertPanel({
  transactions,
}: Props) {
  const alerts =
    transactions
      .filter(
        (txn) =>
          txn.decision ===
            'BLOCKED' ||
          txn.decision ===
            'FLAGGED'
      )
      .sort(
        (a, b) =>
          new Date(
            b.timestamp
          ).getTime() -
          new Date(
            a.timestamp
          ).getTime()
      )
      .slice(0, 5)

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        Live Fraud Alerts
      </h2>

      <div className="space-y-5">
        {alerts.length === 0 ? (
          <div className="text-slate-400">
            No fraud alerts
          </div>
        ) : (
          alerts.map(
            (txn) => (
              <div
                key={
                  txn.transaction_id
                }
                className="bg-slate-800 border border-slate-700 rounded-3xl p-5 hover:border-cyan-500/20 transition-all"
              >
                <div className="flex justify-between items-center mb-4">
                  <span
                    className={`font-bold text-lg ${
                      txn.decision ===
                      'BLOCKED'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {
                      txn.decision
                    }
                  </span>

                  <span className="text-slate-400 text-sm">
                    {new Date(
                      txn.timestamp
                    ).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-medium">
                    {
                      txn.user_id
                    }
                  </p>

                  <p className="text-xl text-slate-200">
                    $
                    {txn.amount}
                  </p>

                  <p className="text-slate-400">
                    {txn.reasons?.join(
                      ', '
                    )}
                  </p>

                  <p className="text-cyan-400 font-medium text-lg pt-2">
                    Risk Score:{' '}
                    {
                      txn.risk_score
                    }
                  </p>
                </div>
              </div>
            )
          )
        )}
      </div>
    </section>
  )
}