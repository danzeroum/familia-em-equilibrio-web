'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { LeisureActivity } from '@/types/database'

export function useLeisureActivities() {
  const supabase = createClient()
  const { currentUser } = useFamilyStore()
  const [items, setItems] = useState<LeisureActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const familyId = currentUser?.family_id

  const load = useCallback(async () => {
    if (!familyId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('leisure_activities')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setIsLoading(false)
  }, [familyId])

  useEffect(() => { load() }, [load])

  const upsert = async (payload: Partial<LeisureActivity>) => {
    if (!familyId) return
    const now = new Date().toISOString()
    if (payload.id) {
      await supabase
        .from('leisure_activities')
        .update({ ...payload, updated_at: now })
        .eq('id', payload.id)
    } else {
      await supabase
        .from('leisure_activities')
        .insert({ ...payload, family_id: familyId, added_by: currentUser?.id, updated_at: now })
    }
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('leisure_activities').delete().eq('id', id)
    load()
  }

  const cycleStatus = async (item: LeisureActivity) => {
    const cycle: LeisureActivity['status'][] = ['wishlist', 'planejado', 'realizado', 'cancelado']
    const next = cycle[(cycle.indexOf(item.status) + 1) % cycle.length]
    await supabase
      .from('leisure_activities')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    load()
  }

  const convertToTask = async (activity: LeisureActivity) => {
    if (!familyId) return null
    const priorityMap: Record<string, number> = { alta: 1, media: 2, baixa: 3 }
    const { data } = await supabase
      .from('tasks')
      .insert({
        family_id: familyId,
        title: `${activity.emoji ?? '🎉'} ${activity.title}`,
        description: activity.description,
        status: 'pending',
        priority: priorityMap[activity.priority] ?? 2,
        assigned_to: activity.added_by,
      })
      .select()
      .single()
    if (data) {
      await supabase
        .from('leisure_activities')
        .update({ task_id: data.id, status: 'planejado', updated_at: new Date().toISOString() })
        .eq('id', activity.id)
      load()
    }
    return data
  }

  const convertToEvent = async (activity: LeisureActivity, eventDate: string) => {
    if (!familyId) return null
    const { data } = await supabase
      .from('family_events')
      .insert({
        family_id: familyId,
        title: `${activity.emoji ?? '🎉'} ${activity.title}`,
        description: activity.description,
        event_date: eventDate,
        event_type: 'general',
        needs_action: false,
        is_done: false,
        location: activity.location_name,
      })
      .select()
      .single()
    if (data) {
      await supabase
        .from('leisure_activities')
        .update({ event_id: data.id, status: 'planejado', updated_at: new Date().toISOString() })
        .eq('id', activity.id)
      load()
    }
    return data
  }

  return { items, isLoading, upsert, remove, cycleStatus, convertToTask, convertToEvent, reload: load }
}
