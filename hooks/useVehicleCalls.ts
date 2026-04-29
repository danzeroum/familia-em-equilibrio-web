'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { VehicleCall } from '@/types/database'

export function useVehicleCalls() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<VehicleCall[]>([])
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
      .from('vehicle_calls')
      .select('*')
      .eq('family_id', fid)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) console.error('[useVehicleCalls] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(item: Partial<VehicleCall>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('vehicle_calls').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[useVehicleCalls] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('vehicle_calls').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useVehicleCalls] insert error:', error.message)
    }
    await load()
  }

  async function markDone(id: string) {
    const { error } = await supabase
      .from('vehicle_calls')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('[useVehicleCalls] markDone error:', error.message)
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('vehicle_calls').delete().eq('id', id)
    if (error) console.error('[useVehicleCalls] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, markDone, remove, reload: load }
}
