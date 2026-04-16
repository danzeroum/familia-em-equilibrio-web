'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Bill } from '@/types/database'

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalMonthly, setTotalMonthly] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    setIsLoading(true)
    const { data } = await supabase
      .from('bills')
      .select('*')
      .order('due_day', { ascending: true })
    setBills(data ?? [])
    setTotalMonthly(
      (data ?? []).reduce((sum, b) => sum + (b.amount ?? 0), 0)
    )
    setIsLoading(false)
  }

  async function updateStatus(id: string, status: Bill['status']) {
    await supabase.from('bills').update({ status, paid_at: status === 'paid' ? new Date().toISOString() : null }).eq('id', id)
    await load()
  }

  async function upsert(bill: Partial<Bill> & { title: string }) {
    if (bill.id) {
      await supabase.from('bills').update(bill).eq('id', bill.id)
    } else {
      await supabase.from('bills').insert(bill as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('bills').delete().eq('id', id)
    await load()
  }

  return { bills, totalMonthly, isLoading, updateStatus, upsert, remove, reload: load }
}
