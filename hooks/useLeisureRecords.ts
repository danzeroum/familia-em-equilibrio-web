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
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('leisure_records').delete().eq('id', id)
    load()
  }

  // Estatísticas do mês atual
  const statsThisMonth = () => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const thisMonth = items.filter((r) => r.date_realized >= monthStart)
    const totalCost = thisMonth.reduce((sum, r) => sum + (r.cost_actual ?? 0), 0)
    const avgRating = thisMonth.length
      ? thisMonth.reduce((sum, r) => sum + (r.rating ?? 0), 0) / thisMonth.length
      : 0
    return { count: thisMonth.length, totalCost, avgRating }
  }

  return { items, isLoading, upsert, remove, statsThisMonth, reload: load }
}
