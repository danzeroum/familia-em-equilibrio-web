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

  const stats = {
    totalThisMonth: items.filter(r => r.date_realized?.startsWith(new Date().toISOString().slice(0, 7))).length,
    totalCost: items.reduce((s, r) => s + (r.cost_actual ?? 0), 0),
    avgRating: items.length
      ? Math.round((items.reduce((s, r) => s + (r.rating ?? 0), 0) / items.filter(r => r.rating).length) * 10) / 10
      : 0,
  }

  return { items, isLoading, upsert, remove, stats, reload: load }
}
