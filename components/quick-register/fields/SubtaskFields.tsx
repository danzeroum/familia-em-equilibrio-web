'use client'
import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useFamilyStore } from '@/store/familyStore'
import type { Profile } from '@/types/database'

interface Props {
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  members: Profile[]
}

export function SubtaskFields({ data, onChange, members }: Props) {
  const supabase = useSupabaseClient()
  const { familyId } = useFamilyStore()
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    supabase
      .from('tasks')
      .select('id, title')
      .eq('family_id', familyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setTasks(data ?? []))
  }, [familyId])

  return (
    <>
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Título da subtarefa *"
        value={(data.title as string) ?? ''}
        onChange={(e) => onChange('title', e.target.value)}
        autoFocus
      />
      <select
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.task_id as string) ?? ''}
        onChange={(e) => onChange('task_id', e.target.value)}
        required
      >
        <option value="">— Tarefa pai * —</option>
        {tasks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>
      <select
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.assigned_to as string) ?? ''}
        onChange={(e) => onChange('assigned_to', e.target.value || undefined)}
      >
        <option value="">— Ninguém —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.emoji} {m.nickname}
          </option>
        ))}
      </select>
    </>
  )
}
