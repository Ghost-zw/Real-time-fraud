'use client'

import { useMemo } from 'react'

type Transaction = {
  decision: string
  risk_score: number
  user_id: string
  account_status?: string
}

export default function useFraudMetrics(
  transactions: any[]
) {

  const approved =
    transactions.filter(
      t =>
        t.decision ===
          'APPROVED'
        ||
        t.decision ===
          'MANUALLY_APPROVED'
    ).length

  const verificationRequired =
    transactions.filter(
      t =>
        t.decision ===
        'VERIFICATION_REQUIRED'
    ).length

  const underReview =
    transactions.filter(
      t =>
        t.decision ===
        'UNDER_REVIEW'
    ).length

  const declined =
    transactions.filter(
      t =>
        t.decision ===
        'DECLINED'
    ).length

  const frozenAccounts =
    transactions.filter(
      t =>
        t.account_status ===
        'FROZEN'
    ).length

  const fraudRate =
    transactions.length
      ? (
          (
            underReview +
            declined
          ) /
          transactions.length
        ) * 100
      : 0

  return {
    approved,
    verificationRequired,
    underReview,
    declined,
    frozenAccounts,
    fraudRate:
      fraudRate.toFixed(1),
  }
}