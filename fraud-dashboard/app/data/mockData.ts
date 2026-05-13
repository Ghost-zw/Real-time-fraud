export const transactions = [
  {
    id: 'txn_001',
    user: 'user_secure',
    amount: '$1500',
    riskScore: 110,
    decision: 'BLOCKED',
    reasons: 'High Amount, Velocity',
    timestamp: '14:20',
  },
  {
    id: 'txn_002',
    user: 'user_123',
    amount: '$750',
    riskScore: 45,
    decision: 'FLAGGED',
    reasons: 'Behavioral Anomaly',
    timestamp: '14:15',
  },
  {
    id: 'txn_003',
    user: 'user_approved',
    amount: '$200',
    riskScore: 10,
    decision: 'APPROVED',
    reasons: 'Normal Pattern',
    timestamp: '14:10',
  },
]