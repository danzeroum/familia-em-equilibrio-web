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
    const { data } = await supabase
      .from('monthly_history_view')
      .select('*')
      .order('month_ref', { ascending: false })
      .limit(6)

    setHistory(data ?? [])
    setIsLoading(false)
  }

  return { history, isLoading, reload: load }
}
