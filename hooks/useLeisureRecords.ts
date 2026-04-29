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
    if (payload.id) {
      await supabase.from('leisure_records').update(payload).eq('id', payload.id)
    } else {
      await supabase.from('leisure_records').insert({ ...payload, family_id: familyId })
    }
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('leisure_records').delete().eq('id', id)
    load()
  }

  // Stats do mês atual
  const monthStats = () => {
    const now = new Date()
    const thisMonth = items.filter(r => {
      const d = new Date(r.date_realized)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const totalCost = thisMonth.reduce((s, r) => s + (r.cost_actual ?? 0), 0)
    const avgRating = thisMonth.length
      ? thisMonth.reduce((s, r) => s + (r.rating ?? 0), 0) / thisMonth.length
      : 0
    return { count: thisMonth.length, totalCost, avgRating }
  }

  return { items, isLoading, upsert, remove, reload: load, monthStats }
}
