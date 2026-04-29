'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { LeisureActivity } from '@/types/database'

const PRIORITY_MAP: Record<string, number> = { baixa: 1, media: 2, alta: 3 }

export function useLeisureActivities() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)

  const [items, setItems] = useState<LeisureActivity[]>([])
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
      .from('leisure_activities')
      .select('*')
      .eq('family_id', fid)
      .order('created_at', { ascending: false })
    if (error) console.error('[useLeisureActivities] load error:', error.message)
    setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(activity: Partial<LeisureActivity> & { title: string }) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...activity }
    if (!payload.added_by) payload.added_by = null
    if (!payload.task_id) payload.task_id = null
    if (!payload.event_id) payload.event_id = null

    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      await supabase
        .from('leisure_activities')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', payload.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('leisure_activities').insert({
        ...payload,
        family_id: fid,
        added_by: payload.added_by ?? user?.id ?? null,
        updated_at: new Date().toISOString(),
      } as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('leisure_activities').delete().eq('id', id)
    await load()
  }

  async function updateStatus(id: string, status: LeisureActivity['status']) {
    await supabase
      .from('leisure_activities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    await load()
  }

  // Converte atividade de lazer em tarefa
  async function convertToTask(activity: LeisureActivity) {
    const fid = familyIdRef.current
    if (!fid) return
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        domain_id: fid,
        title: `${activity.emoji ?? '🎉'} ${activity.title}`,
        description: activity.description ?? null,
        priority: PRIORITY_MAP[activity.priority] ?? 2,
        assigned_to: activity.added_by ?? null,
        status: 'pending',
        checklist: [],
      } as any)
      .select()
      .single()
    if (error) { console.error('[useLeisureActivities] convertToTask error:', error.message); return }
    await supabase
      .from('leisure_activities')
      .update({ task_id: data.id, status: 'planejado', updated_at: new Date().toISOString() })
      .eq('id', activity.id)
    await load()
    return data
  }

  // Converte atividade de lazer em evento familiar
  async function convertToEvent(activity: LeisureActivity, eventDate: string) {
    const fid = familyIdRef.current
    if (!fid) return
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('family_events')
      .insert({
        family_id: fid,
        title: `${activity.emoji ?? '🎉'} ${activity.title}`,
        description: activity.description ?? null,
        event_date: eventDate,
        event_type: 'general',
        budget: activity.estimated_cost ?? null,
        needs_action: false,
        created_by: user?.id ?? null,
      } as any)
      .select()
      .single()
    if (error) { console.error('[useLeisureActivities] convertToEvent error:', error.message); return }
    await supabase
      .from('leisure_activities')
      .update({ event_id: data.id, status: 'planejado', updated_at: new Date().toISOString() })
      .eq('id', activity.id)
    await load()
    return data
  }

  return { items, isLoading, upsert, remove, updateStatus, convertToTask, convertToEvent, reload: load }
}
