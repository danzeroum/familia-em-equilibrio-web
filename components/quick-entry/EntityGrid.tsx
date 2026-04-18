'use client'

import { memo } from 'react'
import type { QuickEntryEntity } from '@/store/quickEntryStore'

export const ENTITIES: {
  key: QuickEntryEntity
  emoji: string
  label: string
}[] = [
  { key: 'task', emoji: '✅', label: 'Tarefa' },
  { key: 'medication', emoji: '💊', label: 'Remédio' },
  { key: 'bill', emoji: '💳', label: 'Conta' },
  { key: 'shopping', emoji: '🛒', label: 'Compra' },
  { key: 'maintenance', emoji: '🔧', label: 'Casa' },
  { key: 'event', emoji: '📅', label: 'Evento' },
  { key: 'vaccine', emoji: '💉', label: 'Vacina' },
  { key: 'checkin', emoji: '😊', label: 'Humor' },
]

type Props = {
  entity: QuickEntryEntity
  onSelect: (e: QuickEntryEntity) => void
}

export const EntityGrid = memo(function EntityGrid({ entity, onSelect }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ENTITIES.map((e) => {
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
      })}
    </div>
  )
})
