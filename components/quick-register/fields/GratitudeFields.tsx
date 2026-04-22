'use client'
import { Member } from '@/store/familyStore'

interface Props {
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  members: Member[]
}

export function GratitudeFields({ data, onChange, members }: Props) {
  return (
    <>
      <textarea
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm resize-none"
        placeholder="Pelo que és grato hoje? *"
        rows={3}
        value={(data.content as string) ?? ''}
        onChange={(e) => onChange('content', e.target.value)}
        autoFocus
      />
      <select
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.member_id as string) ?? ''}
        onChange={(e) => onChange('member_id', e.target.value || undefined)}
      >
        <option value="">— Quem registra? —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.emoji} {m.nickname}
          </option>
        ))}
      </select>
    </>
  )
}
