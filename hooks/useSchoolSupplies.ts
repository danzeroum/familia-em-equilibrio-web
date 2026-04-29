'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { SchoolSupply } from '@/types/database'

export function useSchoolSupplies() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<SchoolSupply[]>([])
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
      .from('school_supplies')
      .select('*')
      .eq('family_id', fid)
      .order('created_at', { ascending: false })
    if (error) console.error('[useSchoolSupplies] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(item: Partial<SchoolSupply>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('school_supplies').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[useSchoolSupplies] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('school_supplies').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useSchoolSupplies] insert error:', error.message)
    }
    await load()
  }

  async function updateStatus(id: string, status: SchoolSupply['status'], buyerId?: string) {
    const payload = {
      status,
      bought_at: status === 'bought' ? new Date().toISOString() : null,
      bought_by: status === 'bought' && buyerId ? buyerId : null,
    }
    const { error } = await supabase.from('school_supplies').update(payload).eq('id', id)
    if (error) console.error('[useSchoolSupplies] updateStatus error:', error.message)
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('school_supplies').delete().eq('id', id)
    if (error) console.error('[useSchoolSupplies] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, updateStatus, remove, reload: load }
}
