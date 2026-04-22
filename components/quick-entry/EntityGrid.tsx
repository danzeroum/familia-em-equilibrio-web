'use client'

import { memo } from 'react'
import type { QuickEntryEntity } from '@/store/quickEntryStore'

export const ENTITIES: {
  key: QuickEntryEntity
  emoji: string
  label: string
  group: 'principal' | 'outros'
}[] = [
  // Principais — Onda 1 existentes
  { key: 'task',        emoji: '✅', label: 'Tarefa',    group: 'principal' },
  { key: 'medication',  emoji: '💊', label: 'Remédio',   group: 'principal' },
  { key: 'bill',        emoji: '💳', label: 'Conta',     group: 'principal' },
  { key: 'shopping',    emoji: '🛒', label: 'Compra',    group: 'principal' },
  { key: 'maintenance', emoji: '🔧', label: 'Casa',      group: 'principal' },
  { key: 'event',       emoji: '📅', label: 'Evento',    group: 'principal' },
  { key: 'vaccine',     emoji: '💉', label: 'Vacina',    group: 'principal' },
  { key: 'checkin',     emoji: '😊', label: 'Humor',     group: 'principal' },
  // Principais — Onda 1 novos
  { key: 'subtask',         emoji: '↳',  label: 'Subtarefa', group: 'principal' },
  { key: 'health_tracking', emoji: '🩺', label: 'Saúde',     group: 'principal' },
  { key: 'homework',        emoji: '📚', label: 'Lição',     group: 'principal' },
  { key: 'school_item',     emoji: '🎒', label: 'Escola',    group: 'principal' },
  // Outros — Onda 2
  { key: 'emergency_contact', emoji: '☎️', label: 'Contato',  group: 'outros' },
  { key: 'gratitude',         emoji: '🙏', label: 'Gratidão', group: 'outros' },
  { key: 'maintenance_call',  emoji: '🛠️', label: 'Chamada',  group: 'outros' },
]

type Props = {
  entity: QuickEntryEntity
  onSelect: (e: QuickEntryEntity) => void
}

export const EntityGrid = memo(function EntityGrid({ entity, onSelect }: Props) {
  const principal = ENTITIES.filter((e) => e.group === 'principal')
  const outros    = ENTITIES.filter((e) => e.group === 'outros')

  function renderChip(e: (typeof ENTITIES)[number]) {
    const active = entity === e.key
    return (
      <button
        key={e.key}
        type="button"
        onClick={() => onSelect(e.key)}
        className={
          'flex flex-col items-center gap-1 p-3 rounded-xl border-2 ' +
          'transition-colors text-xs font-medium ' +
          (active
            ? 'border-teal-500 bg-teal-50 text-teal-700'
            : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200')
        }
      >
        <span className="text-xl">{e.emoji}</span>
        {e.label}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {principal.map(renderChip)}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
          Outros
        </p>
        <div className="grid grid-cols-4 gap-2">
          {outros.map(renderChip)}
        </div>
      </div>
    </div>
  )
})
