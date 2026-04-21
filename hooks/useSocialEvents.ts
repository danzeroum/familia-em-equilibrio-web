'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { SocialEvent } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useSocialEvents() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<SocialEvent[]>([])
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
    const { data, error } = await db
      .from('social_events')
      .select('*')
      .eq('family_id', fid)
      .order('event_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    if (error) console.error('[useSocialEvents] load error:', error.message)
    else setItems((data ?? []) as SocialEvent[])
    setIsLoading(false)
  }

  async function upsert(item: Partial<SocialEvent>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await db.from('social_events').update(updateData).eq('id', payload.id)
      if (error) console.error('[useSocialEvents] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await db.from('social_events').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      })
      if (error) console.error('[useSocialEvents] insert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    const { error } = await db.from('social_events').delete().eq('id', id)
    if (error) console.error('[useSocialEvents] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, remove, reload: load }
}
