'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { SocialEventContact } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useSocialEventContacts() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<SocialEventContact[]>([])
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
      .from('social_event_contacts')
      .select('*')
      .eq('family_id', fid)
      .order('role', { ascending: true })
      .order('name', { ascending: true })
    if (error) console.error('[useSocialEventContacts] load error:', error.message)
    else setItems((data ?? []) as SocialEventContact[])
    setIsLoading(false)
  }

  async function upsert(item: Partial<SocialEventContact>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await db.from('social_event_contacts').update(updateData).eq('id', payload.id)
      if (error) console.error('[useSocialEventContacts] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await db.from('social_event_contacts').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      })
      if (error) console.error('[useSocialEventContacts] insert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    const { error } = await db.from('social_event_contacts').delete().eq('id', id)
    if (error) console.error('[useSocialEventContacts] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, remove, reload: load }
}
