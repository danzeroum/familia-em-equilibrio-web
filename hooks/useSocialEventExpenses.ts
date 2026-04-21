'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { SocialEventExpense } from '@/types/database'

export function useSocialEventExpenses() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<SocialEventExpense[]>([])
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
      .from('social_event_expenses')
      .select('*')
      .eq('family_id', fid)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) console.error('[useSocialEventExpenses] load error:', error.message)
    else setItems((data ?? []) as SocialEventExpense[])
    setIsLoading(false)
  }

  async function upsert(item: Partial<SocialEventExpense>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('social_event_expenses').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[useSocialEventExpenses] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('social_event_expenses').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useSocialEventExpenses] insert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('social_event_expenses').delete().eq('id', id)
    if (error) console.error('[useSocialEventExpenses] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, remove, reload: load }
}
