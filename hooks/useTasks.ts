'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task } from '@/types/database'

export function useTasks(filters?: { assignedTo?: string; status?: Task['status'] }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [filters?.assignedTo, filters?.status])

  async function load() {
    setIsLoading(true)
    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })

    if (filters?.assignedTo) query = query.eq('assigned_to', filters.assignedTo)
    if (filters?.status) query = query.eq('status', filters.status)

    const { data } = await query
    setTasks((data ?? []).map(t => ({
      ...t,
      checklist: Array.isArray(t.checklist) ? t.checklist : [],
    })))
    setIsLoading(false)
  }

  async function upsert(task: Partial<Task> & { title: string }) {
    const payload = {
      ...task,
      checklist: task.checklist ?? [],
    }
    if (payload.id) {
      await supabase.from('tasks').update(payload).eq('id', payload.id)
    } else {
      await supabase.from('tasks').insert(payload as any)
    }
    await load()
  }

  async function updateChecklist(id: string, checklist: Task['checklist']) {
    await supabase.from('tasks').update({ checklist }).eq('id', id)
    await load()
  }

  async function complete(id: string, validatedBy?: string) {
    await supabase.from('tasks').update({
      status: 'done',
      completed_at: new Date().toISOString(),
      ...(validatedBy ? { validated_by: validatedBy, validated_at: new Date().toISOString() } : {}),
    }).eq('id', id)
    await load()
  }

  async function remove(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    await load()
  }

  return { tasks, isLoading, upsert, complete, remove, reload: load, updateChecklist }
}
