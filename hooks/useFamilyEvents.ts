'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { daysUntil, getPriority } from '@/lib/utils'
import type { FamilyEvent } from '@/types/database'

export interface FamilyEventWithMeta extends FamilyEvent {
  daysLeft: number | null
  priority: 'urgent' | 'attention' | 'planned' | 'overdue'
}

export function useFamilyEvents(familyId: string | null) {
  const [events, setEvents] = useState<FamilyEventWithMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!familyId) { setIsLoading(false); return }
    load()
  }, [familyId])

  async function load() {
    setIsLoading(true)
    const { data } = await supabase
      .from('family_events')
      .select('*')
      .eq('family_id', familyId!)
      .order('event_date', { ascending: true })

    const enriched = (data ?? []).map((e) => ({
      ...e,
      daysLeft: daysUntil(e.event_date),
      priority: getPriority(daysUntil(e.event_date)),
    }))
    setEvents(enriched)
    setIsLoading(false)
  }

  async function upsert(event: Partial<FamilyEvent> & { title: string; event_date: string }) {
    if (event.id) {
      await supabase.from('family_events').update(event).eq('id', event.id)
    } else {
      await supabase.from('family_events').insert({ ...event, family_id: familyId } as any)
    }
    await load()
  }

  async function toggleDone(id: string, current: boolean) {
    await supabase.from('family_events').update({ is_done: !current }).eq('id', id)
    await load()
  }

  async function remove(id: string) {
    await supabase.from('family_events').delete().eq('id', id)
    await load()
  }

  return { events, isLoading, upsert, toggleDone, remove, reload: load }
}
