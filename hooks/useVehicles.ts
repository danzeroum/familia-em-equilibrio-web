'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { Vehicle } from '@/types/database'

export function useVehicles() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<Vehicle[]>([])
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
      .from('vehicles')
      .select('*')
      .eq('family_id', fid)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) console.error('[useVehicles] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(item: Partial<Vehicle>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('vehicles').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[useVehicles] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('vehicles').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useVehicles] insert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) console.error('[useVehicles] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, remove, reload: load }
}
