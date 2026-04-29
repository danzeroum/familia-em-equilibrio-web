'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface MonthlyHistory {
  family_id: string
  month_ref: string
  income: number
  total_paid: number
  balance: number
  bills_count: number
}

export function useMonthlyHistory() {
  const [history, setHistory] = useState<MonthlyHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('monthly_history_view')
      .select('*')
      .order('month_ref', { ascending: false })
      .limit(6)

    if (error) console.error('[useMonthlyHistory] load error:', error.message)
    // Supabase retorna `numeric` como string — normaliza para number
    const rows: MonthlyHistory[] = (data ?? []).map((r: any) => ({
      family_id:   r.family_id,
      month_ref:   r.month_ref,
      income:      Number(r.income ?? 0),
      total_paid:  Number(r.total_paid ?? 0),
      balance:     Number(r.balance ?? 0),
      bills_count: Number(r.bills_count ?? 0),
    }))
    setHistory(rows)
    setIsLoading(false)
  }

  return { history, isLoading, reload: load }
}
