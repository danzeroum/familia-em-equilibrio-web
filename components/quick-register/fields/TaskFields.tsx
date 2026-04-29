'use client'
import type { Profile } from '@/types/database'

interface Props {
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  members: Profile[]
}

export function TaskFields({ data, onChange, members }: Props) {
  return (
    <>
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Título da tarefa *"
        value={(data.title as string) ?? ''}
        onChange={(e) => onChange('title', e.target.value)}
        autoFocus
      />
      <select
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.assigned_to as string) ?? ''}
        onChange={(e) => onChange('assigned_to', e.target.value || undefined)}
      >
        <option value="">— Ninguém —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {(m.nickname ?? m.name) ?? m.name}
          </option>
        ))}
      </select>
      <input
        type="date"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.due_date as string) ?? ''}
        onChange={(e) => onChange('due_date', e.target.value || undefined)}
      />
    </>
  )
}
