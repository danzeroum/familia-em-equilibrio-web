'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types/database'

const ALLOWED_COLUMNS = new Set([
  'id', 'domain_id', 'title', 'description', 'due_date', 'due_time', 'status',
  'assigned_to', 'created_by', 'recurrence_id', 'notes',
  'requires_supervision', 'validated_by', 'validated_at',
  'priority', 'visible_from', 'completed_at', 'checklist',
])

const PRIORITY_MAP: Record<string, number> = { low: 1, medium: 2, high: 3 }

function cleanPayload(raw: Record<string, any>) {
  const cleaned: Record<string, any> = {}

  for (const key of Object.keys(raw)) {
    if (!ALLOWED_COLUMNS.has(key)) continue
    let value = raw[key]

    if (key === 'priority' && typeof value === 'string') {
      value = PRIORITY_MAP[value] ?? 2
    }

    if (['assigned_to', 'created_by', 'recurrence_id', 'validated_by'].includes(key) && value === '') {
      value = null
    }

    // due_time vazio → null
    if (key === 'due_time' && !value) value = null

    cleaned[key] = value
  }

  cleaned.checklist = Array.isArray(cleaned.checklist) ? cleaned.checklist : []
  if (!cleaned.status) cleaned.status = 'pending'

  return cleaned
}

export function useTasks(filters?: { assignedTo?: string; status?: Task['status'] }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [filters?.assignedTo, filters?.status])

  async function load() {
    setIsLoading(true)
    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('due_time', { ascending: true, nullsFirst: false })

    if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data, error } = await query
    if (error) console.error('[useTasks] load error:', error)
    setTasks(
      (data ?? []).map(t => ({
        ...t,
        checklist: Array.isArray(t.checklist) ? t.checklist : [],
      }))
    )
    setIsLoading(false)
  }

  async function upsert(task: Partial<Task> & { title: string }) {
    const payload = cleanPayload(task as Record<string, any>)

    let error
    if (payload.id) {
      ;({ error } = await supabase.from('tasks').update(payload).eq('id', payload.id))
    } else {
      const { id: _id, ...insertPayload } = payload
      ;({ error } = await supabase.from('tasks').insert(insertPayload as any))
    }

    if (error) console.error('[useTasks] upsert error:', error)
    await load()
  }

  async function updateChecklist(id: string, checklist: Task['checklist']) {
    const { error } = await supabase.from('tasks').update({ checklist }).eq('id', id)
    if (error) console.error('[useTasks] updateChecklist error:', error)
    await load()
  }

  async function complete(id: string, validatedBy?: string) {
    const { error } = await supabase.from('tasks').update({
      status: 'done',
      completed_at: new Date().toISOString(),
      ...(validatedBy ? { validated_by: validatedBy, validated_at: new Date().toISOString() } : {}),
    }).eq('id', id)
    if (error) console.error('[useTasks] complete error:', error)
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) console.error('[useTasks] remove error:', error)
    await load()
  }

  return { tasks, isLoading, upsert, complete, remove, reload: load, updateChecklist }
}
