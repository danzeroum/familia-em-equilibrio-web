'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { daysUntil, getPriority } from '@/lib/utils'
import type { FamilyEvent } from '@/types/database'

export interface FamilyEventWithMeta extends FamilyEvent {
  daysLeft: number | null
  priority: 'urgent' | 'attention' | 'planned' | 'overdue'
}

// Colunas reais da tabela — campos calculados são removidos antes do upsert
const DB_COLUMNS: (keyof FamilyEvent)[] = [
  'id', 'title', 'event_date', 'event_type', 'needs_action', 'action_description',
  'budget', 'budget_estimate', 'is_done', 'created_by', 'family_id', 'created_at',
  'description', 'event_time', 'location', 'assigned_to', 'participants', 'notes',
]

function stripMeta(event: Partial<FamilyEvent & Record<string, any>>): Partial<FamilyEvent> {
  const clean: Partial<FamilyEvent> = {}
  for (const key of DB_COLUMNS) {
    if (key in event && event[key] !== undefined) {
      (clean as any)[key] = event[key]
    }
  }
  return clean
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
    const payload = stripMeta({ ...event, family_id: familyId })
    if (payload.id) {
      const { id, created_at, created_by, ...updateFields } = payload as any
      const { error } = await supabase.from('family_events').update(updateFields).eq('id', id)
      if (error) throw error
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const insertPayload = { ...payload, created_by: user?.id }
      const { error } = await supabase.from('family_events').insert(insertPayload as any)
      if (error) throw error
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
