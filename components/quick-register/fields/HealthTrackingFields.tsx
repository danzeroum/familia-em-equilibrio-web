'use client'
import type { Profile } from '@/types/database'

interface Props {
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  members: Profile[]
}

const METRICS = [
  { value: 'weight', label: '⚖️ Peso (kg)' },
  { value: 'temperature', label: '🌡️ Temperatura (°C)' },
  { value: 'blood_pressure', label: '🩸 Pressão arterial' },
  { value: 'glucose', label: '🍬 Glicemia (mg/dL)' },
  { value: 'heart_rate', label: '❤️ Freq. cardíaca (bpm)' },
  { value: 'sleep_hours', label: '😴 Horas de sono' },
  { value: 'other', label: '📊 Outro' },
]

export function HealthTrackingFields({ data, onChange, members }: Props) {
  return (
    <>
      <select
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.member_id as string) ?? ''}
        onChange={(e) => onChange('member_id', e.target.value)}
        required
      >
        <option value="">— Quem? * —</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {(m.nickname ?? m.name) ?? m.name}
          </option>
        ))}
      </select>
      <select
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.metric as string) ?? ''}
        onChange={(e) => onChange('metric', e.target.value)}
        required
      >
        <option value="">— Métrica * —</option>
        {METRICS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <input
        type="number"
        step="0.1"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        placeholder="Valor *"
        value={(data.value as number) ?? ''}
        onChange={(e) => onChange('value', parseFloat(e.target.value))}
        required
      />
      <input
        type="date"
        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
        value={(data.date as string) ?? new Date().toISOString().split('T')[0]}
        onChange={(e) => onChange('date', e.target.value)}
      />
    </>
  )
}
