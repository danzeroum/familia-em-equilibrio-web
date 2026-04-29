'use client'

interface Props {
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

export function EmergencyContactFields({ data, onChange }: Props) {
  return (
    <>
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Nome *"
        value={(data.name as string) ?? ''}
        onChange={(e) => onChange('name', e.target.value)}
        autoFocus
      />
      <input
        type="tel"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Telefone *"
        value={(data.phone as string) ?? ''}
        onChange={(e) => onChange('phone', e.target.value)}
      />
      <input
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Relação (ex: Médico, Vizinho)"
        value={(data.relation as string) ?? ''}
        onChange={(e) => onChange('relation', e.target.value || undefined)}
      />
    </>
  )
}
