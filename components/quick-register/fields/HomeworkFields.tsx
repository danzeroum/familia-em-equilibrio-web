'use client'
import type { Profile } from '@/types/database'

interface Props {
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  members: Profile[]
}

export function HomeworkFields({ data, onChange, members }: Props) {
  const children = members.filter((m) => (m.role === 'child' || m.role === 'teen'))

  return (
    <>
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Título da lição *"
        value={(data.title as string) ?? ''}
        onChange={(e) => onChange('title', e.target.value)}
        autoFocus
      />
      <select
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.member_id as string) ?? ''}
        onChange={(e) => onChange('member_id', e.target.value)}
        required
      >
        <option value="">— Para quem? * —</option>
        {(children.length > 0 ? children : members).map((m) => (
          <option key={m.id} value={m.id}>
            {(m.nickname ?? m.name) ?? m.name}
          </option>
        ))}
      </select>
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Disciplina"
        value={(data.subject as string) ?? ''}
        onChange={(e) => onChange('subject', e.target.value || undefined)}
      />
      <input
        type="date"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.due_date as string) ?? ''}
        onChange={(e) => onChange('due_date', e.target.value || undefined)}
      />
    </>
  )
}
