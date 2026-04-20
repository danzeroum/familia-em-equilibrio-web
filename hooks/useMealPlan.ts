'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { MealPlan } from '@/types/database'

export function useMealPlan() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<MealPlan[]>([])
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
      .from('meal_plan')
      .select('*')
      .eq('family_id', fid)
      .order('day_of_week', { ascending: true })
      .order('meal_type', { ascending: true })
    if (error) console.error('[useMealPlan] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(item: Partial<MealPlan>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('meal_plan').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[useMealPlan] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('meal_plan').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useMealPlan] insert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('meal_plan').delete().eq('id', id)
    if (error) console.error('[useMealPlan] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, remove, reload: load }
}
