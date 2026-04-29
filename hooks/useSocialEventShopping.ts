'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { SocialEventShopping } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useSocialEventShopping() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<SocialEventShopping[]>([])
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
      .from('social_event_shopping')
      .select('*')
      .eq('family_id', fid)
      .order('is_bought', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) console.error('[useSocialEventShopping] load error:', error.message)
    else setItems((data ?? []) as SocialEventShopping[])
    setIsLoading(false)
  }

  async function upsert(item: Partial<SocialEventShopping>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await db.from('social_event_shopping').update(updateData).eq('id', payload.id)
      if (error) console.error('[useSocialEventShopping] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await db.from('social_event_shopping').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      })
      if (error) console.error('[useSocialEventShopping] insert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    const { error } = await db.from('social_event_shopping').delete().eq('id', id)
    if (error) console.error('[useSocialEventShopping] remove error:', error.message)
    await load()
  }

  async function toggleBought(id: string, isBought: boolean) {
    const { error } = await db.from('social_event_shopping').update({ is_bought: isBought }).eq('id', id)
    if (error) console.error('[useSocialEventShopping] toggleBought error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, remove, toggleBought, reload: load }
}
