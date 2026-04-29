'use client'

interface Props {
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

export function MaintenanceCallFields({ data, onChange }: Props) {
  return (
    <>
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Serviço / problema *"
        value={(data.title as string) ?? ''}
        onChange={(e) => onChange('title', e.target.value)}
        autoFocus
      />
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Prestador / empresa"
        value={(data.provider as string) ?? ''}
        onChange={(e) => onChange('provider', e.target.value || undefined)}
      />
      <input
        type="date"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.scheduled_date as string) ?? ''}
        onChange={(e) => onChange('scheduled_date', e.target.value || undefined)}
      />
    </>
  )
}
