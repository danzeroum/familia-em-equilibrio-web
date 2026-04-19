'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface MonthlyHistory {
  family_id: string
  month: string
  month_ref: string
  total_paid: number
  total_pending: number
  total_auto_debit: number
  total_amount: number
  paid_count: number
  pending_count: number
  auto_debit_count: number
  total_count: number
  top_category: string | null
  top_category_amount: number | null
  // computed aliases
  income: number
  balance: number
  bills_count: number
}

export function useMonthlyHistory() {
  const [history, setHistory] = useState<MonthlyHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setIsLoading(true)
    const { data } = await supabase
      .from('monthly_history_view')
      .select('*')
      .order('month', { ascending: false })
      .limit(6)

    setHistory((data ?? []).map(row => ({
      ...row,
      month_ref: row.month,
      bills_count: row.total_count,
      income: 0,
      balance: -(row.total_paid ?? 0),
    })))
    setIsLoading(false)
  }

  return { history, isLoading, reload: load }
}
