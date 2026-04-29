'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { SocialEventTask } from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export function useSocialEventTasks() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<SocialEventTask[]>([])
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
      .from('social_event_tasks')
      .select('*')
      .eq('family_id', fid)
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
    if (error) console.error('[useSocialEventTasks] load error:', error.message)
    else setItems((data ?? []) as SocialEventTask[])
    setIsLoading(false)
  }

  async function upsert(item: Partial<SocialEventTask>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await db.from('social_event_tasks').update(updateData).eq('id', payload.id)
      if (error) console.error('[useSocialEventTasks] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await db.from('social_event_tasks').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      })
      if (error) console.error('[useSocialEventTasks] insert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    const { error } = await db.from('social_event_tasks').delete().eq('id', id)
    if (error) console.error('[useSocialEventTasks] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, remove, reload: load }
}
