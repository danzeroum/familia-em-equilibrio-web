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
      await supabase.from('leisure_records').insert({ ...row, created_at: new Date().toISOString() })
    }
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('leisure_records').delete().eq('id', id)
    load()
  }

  // Totalizadores do mês atual
  const monthStats = () => {
    const now = new Date()
    const thisMonth = items.filter((r) => {
      const d = new Date(r.date_realized)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const totalCost = thisMonth.reduce((sum, r) => sum + (r.cost_actual ?? 0), 0)
    const avgRating =
      thisMonth.length > 0
        ? thisMonth.reduce((sum, r) => sum + (r.rating ?? 0), 0) / thisMonth.length
        : 0
    return { count: thisMonth.length, totalCost, avgRating: +avgRating.toFixed(1) }
  }

  return { items, isLoading, upsert, remove, monthStats, reload: load }
}
