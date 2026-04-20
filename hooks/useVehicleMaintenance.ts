'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { VehicleMaintenance } from '@/types/database'

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function useVehicleMaintenance() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<VehicleMaintenance[]>([])
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
      .from('vehicle_maintenance')
      .select('*')
      .eq('family_id', fid)
      .order('next_due_at', { ascending: true, nullsFirst: false })
    if (error) console.error('[useVehicleMaintenance] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(item: Partial<VehicleMaintenance>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    // auto-calcula next_due_at se temos last_done_at + frequency_days
    if (payload.last_done_at && payload.frequency_days && !payload.next_due_at) {
      payload.next_due_at = addDays(new Date(payload.last_done_at), payload.frequency_days)
    }
    if (payload.last_done_km != null && payload.frequency_km && payload.next_due_km == null) {
      payload.next_due_km = payload.last_done_km + payload.frequency_km
    }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('vehicle_maintenance').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[useVehicleMaintenance] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('vehicle_maintenance').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useVehicleMaintenance] insert error:', error.message)
    }
    await load()
  }

  async function markDone(id: string, doneKm?: number) {
    const item = items.find(x => x.id === id)
    if (!item) return
    const today = new Date().toISOString().slice(0, 10)
    const update: Partial<VehicleMaintenance> = {
      last_done_at: today,
      status: 'ok',
    }
    if (item.frequency_days) {
      update.next_due_at = addDays(new Date(today), item.frequency_days)
    }
    if (doneKm != null) {
      update.last_done_km = doneKm
      if (item.frequency_km) update.next_due_km = doneKm + item.frequency_km
    }
    const { error } = await supabase.from('vehicle_maintenance').update(update as any).eq('id', id)
    if (error) console.error('[useVehicleMaintenance] markDone error:', error.message)
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('vehicle_maintenance').delete().eq('id', id)
    if (error) console.error('[useVehicleMaintenance] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, markDone, remove, reload: load }
}
