'use client'

import { useMemo } from 'react'

type Transaction = {
  decision: string
  risk_score: number
  user_id: string
  account_status?: string
}

export default function useFraudMetrics(
  transactions: Transaction[]
) {
  return useMemo(() => {
    const approved =
  transactions.filter(
    (txn) =>
      txn.decision ===
        'APPROVED' ||
      txn.decision ===
        'MANUALLY_APPROVED'
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

    const highRiskUsers =
      new Set(
        transactions
          .filter(
            (t) =>
              t.risk_score >=
              70
          )
          .map(
            (t) => t.user_id
          )
      ).size

    const frozenAccounts =
      transactions.filter(
        (txn) =>
          txn.account_status ===
          'FROZEN'
      ).length

    return {
      approved,
      flagged,
      blocked,
      fraudRate,
      highRiskUsers,
      frozenAccounts,
    }
  }, [transactions])
}