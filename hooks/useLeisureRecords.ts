'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { LeisureRecord } from '@/types/database'

export function useLeisureRecords() {
  const supabase = createClient()
  const { currentUser } = useFamilyStore()
  const [items, setItems] = useState<LeisureRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const familyId = currentUser?.family_id

  const load = useCallback(async () => {
    if (!familyId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('leisure_records')
      .select('*')
      .eq('family_id', familyId)
      .order('date_realized', { ascending: false })
    setItems(data ?? [])
    setIsLoading(false)
  }, [familyId])

  useEffect(() => { load() }, [load])

  const upsert = async (payload: Partial<LeisureRecord>) => {
    if (!familyId) return
    const row = { ...payload, family_id: familyId }
    if (payload.id) {
      await supabase.from('leisure_records').update(row).eq('id', payload.id)
    } else {
      await supabase.from('leisure_records').insert(row)
    }
    await load()
  }

  const remove = async (id: string) => {
    await supabase.from('leisure_records').delete().eq('id', id)
    await load()
  }

  // Estatísticas do mês corrente
  const statsThisMonth = (() => {
    const now = new Date()
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonth = items.filter(r => r.date_realized?.startsWith(monthStr))
    const totalCost = thisMonth.reduce((s, r) => s + (r.cost_actual ?? 0), 0)
    const ratings = thisMonth.filter(r => r.rating != null).map(r => r.rating as number)
    const avgRating = ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0
    return { count: thisMonth.length, totalCost, avgRating: Math.round(avgRating * 10) / 10 }
  })()

  return { items, isLoading, upsert, remove, statsThisMonth, reload: load }
}
