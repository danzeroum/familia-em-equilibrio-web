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
    const row = { ...payload, family_id: familyId, updated_at: now }
    if (payload.id) {
      await supabase.from('leisure_activities').update(row).eq('id', payload.id)
    } else {
      await supabase.from('leisure_activities').insert({ ...row, added_by: currentUser?.id })
    }
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('leisure_activities').delete().eq('id', id)
    load()
  }

  const updateStatus = async (id: string, status: LeisureActivity['status']) => {
    await supabase
      .from('leisure_activities')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
    load()
  }

  // STATUS_CYCLE: wishlist -> planejado -> realizado -> cancelado
  const cycleStatus = async (activity: LeisureActivity) => {
    const cycle: LeisureActivity['status'][] = ['wishlist', 'planejado', 'realizado', 'cancelado']
    const next = cycle[(cycle.indexOf(activity.status) + 1) % cycle.length]
    await updateStatus(activity.id, next)
  }

  // Converte atividade em tarefa na tabela tasks
  const convertToTask = async (activity: LeisureActivity) => {
    if (!familyId) return null
    const priorityMap: Record<string, 1 | 2 | 3> = { alta: 1, media: 2, baixa: 3 }
    const { data, error } = await supabase
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
    if (!error && data) {
      await supabase
        .from('leisure_activities')
        .update({ task_id: data.id, status: 'planejado', updated_at: new Date().toISOString() })
        .eq('id', activity.id)
      load()
    }
    return data ?? null
  }

  // Converte atividade em evento de familia
  const convertToEvent = async (activity: LeisureActivity, eventDate: string) => {
    if (!familyId) return null
    const { data, error } = await supabase
      .from('family_events')
      .insert({
        family_id: familyId,
        title: `${activity.emoji ?? '🎉'} ${activity.title}`,
        description: activity.description,
        event_date: eventDate,
        event_type: 'general',
        location: activity.location_name,
        needs_action: false,
        is_done: false,
        budget_estimate: activity.estimated_cost,
      })
      .select()
      .single()
    if (!error && data) {
      await supabase
        .from('leisure_activities')
        .update({ event_id: data.id, status: 'planejado', updated_at: new Date().toISOString() })
        .eq('id', activity.id)
      load()
    }
    return data ?? null
  }

  return {
    items,
    isLoading,
    upsert,
    remove,
    updateStatus,
    cycleStatus,
    convertToTask,
    convertToEvent,
    reload: load,
  }
}
