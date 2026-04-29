'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { LeisureRecord } from '@/types/database'

export function useLeisureRecords() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)

  const [records, setRecords] = useState<LeisureRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const familyIdRef = useRef(familyId)
  useEffect(() => { familyIdRef.current = familyId }, [familyId])

  useEffect(() => {
    if (!familyId) return
    load()
  }, [familyId])

  async function load() {
    const fid = familyIdRef.current
    if (!fid) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('leisure_records')
      .select('*')
      .eq('family_id', fid)
      .order('date_realized', { ascending: false })
    if (error) console.error('[useLeisureRecords] load error:', error.message)
    setRecords(data ?? [])
    setIsLoading(false)
  }

  async function upsert(record: Partial<LeisureRecord> & { title: string }) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...record }
    if (!payload.activity_id) payload.activity_id = null

    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      await supabase.from('leisure_records').update(updateData).eq('id', payload.id)
    } else {
      await supabase.from('leisure_records').insert({
        ...payload,
        family_id: fid,
      } as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('leisure_records').delete().eq('id', id)
    await load()
  }

  // Totalizadores do mês atual
  const currentMonth = new Date().toISOString().slice(0, 7)
  const thisMonth = records.filter(r => r.date_realized.startsWith(currentMonth))
  const avgRating = thisMonth.length
    ? Math.round((thisMonth.reduce((s, r) => s + (r.rating ?? 0), 0) / thisMonth.length) * 10) / 10
    : 0
  const totalCost = thisMonth.reduce((s, r) => s + (r.cost_actual ?? 0), 0)

  return { records, isLoading, upsert, remove, reload: load, thisMonth, avgRating, totalCost }
}
