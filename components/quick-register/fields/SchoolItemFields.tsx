'use client'
import { Member } from '@/store/familyStore'

interface Props {
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  members: Member[]
}

export function SchoolItemFields({ data, onChange, members }: Props) {
  const children = members.filter((m) => m.is_child)

  return (
    <>
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Nome do item *"
        value={(data.name as string) ?? ''}
        onChange={(e) => onChange('name', e.target.value)}
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
            {m.emoji} {m.nickname}
          </option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Quantidade"
        value={(data.quantity as number) ?? 1}
        onChange={(e) => onChange('quantity', parseInt(e.target.value))}
      />
    </>
  )
}
