'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { PantryItem } from '@/types/database'

export function usePantryItems() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<PantryItem[]>([])
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
      .from('pantry_items')
      .select('*')
      .eq('family_id', fid)
      .order('category', { ascending: true, nullsFirst: false })
      .order('name', { ascending: true })
    if (error) console.error('[usePantryItems] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(item: Partial<PantryItem>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('pantry_items').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[usePantryItems] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('pantry_items').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[usePantryItems] insert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('pantry_items').delete().eq('id', id)
    if (error) console.error('[usePantryItems] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, remove, reload: load }
}
