'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { VehicleDocument } from '@/types/database'

export function useVehicleDocuments() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<VehicleDocument[]>([])
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
      .from('vehicle_documents')
      .select('*')
      .eq('family_id', fid)
      .order('due_date', { ascending: true, nullsFirst: false })
    if (error) console.error('[useVehicleDocuments] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(item: Partial<VehicleDocument>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('vehicle_documents').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[useVehicleDocuments] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('vehicle_documents').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useVehicleDocuments] insert error:', error.message)
    }
    await load()
  }

  async function markPaid(id: string) {
    const { error } = await supabase
      .from('vehicle_documents')
      .update({ status: 'paid', paid_at: new Date().toISOString().slice(0, 10) })
      .eq('id', id)
    if (error) console.error('[useVehicleDocuments] markPaid error:', error.message)
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('vehicle_documents').delete().eq('id', id)
    if (error) console.error('[useVehicleDocuments] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, markPaid, remove, reload: load }
}
