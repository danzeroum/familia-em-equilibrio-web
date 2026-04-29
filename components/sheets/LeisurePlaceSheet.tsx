'use client'
import { useState, useEffect } from 'react'
import type { LeisurePlace, LeisurePlaceCategory } from '@/types/database'

const PLACE_CATEGORIES: { value: LeisurePlaceCategory; label: string; emoji: string }[] = [
  { value: 'parque',      label: 'Parque',      emoji: '🌳' },
  { value: 'praia',       label: 'Praia',       emoji: '🏖️' },
  { value: 'restaurante', label: 'Restaurante', emoji: '🍽️' },
  { value: 'cinema',      label: 'Cinema',      emoji: '🎬' },
  { value: 'teatro',      label: 'Teatro',      emoji: '🎭' },
  { value: 'museu',       label: 'Museu',       emoji: '🏛️' },
  { value: 'esporte',     label: 'Esporte',     emoji: '⚽' },
  { value: 'viagem',      label: 'Viagem',      emoji: '✈️' },
  { value: 'clube',       label: 'Clube',       emoji: '🏊' },
  { value: 'outros',      label: 'Outros',      emoji: '📍' },
]

type Member = { id: string; name: string; emoji?: string | null; nickname?: string | null }

interface Props {
  open: boolean
  onClose: () => void
  item: LeisurePlace | null
  onSave: (payload: Partial<LeisurePlace>) => Promise<void>
  members: Member[]
}

export function LeisurePlaceSheet({ open, onClose, item, onSave, members: _members }: Props) {
  const [form, setForm] = useState<Partial<LeisurePlace>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(item ?? { category: 'outros', is_favorite: false, visited_count: 0, tags: [] })
  }, [item, open])

  if (!open) return null

  const set = (k: keyof LeisurePlace, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">{item ? 'Editar Lugar' : 'Novo Lugar Favorito'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">✕</button>
        </div>

        {/* Emoji + Nome */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="📍"
            value={form.emoji ?? ''}
            onChange={e => set('emoji', e.target.value)}
            className="w-14 border rounded-lg px-2 py-2 text-center text-xl"
            maxLength={4}
          />
          <input
            type="text"
            placeholder="Nome do lugar *"
            value={form.name ?? ''}
            onChange={e => set('name', e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {PLACE_CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => set('category', c.value)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  form.category === c.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Endereço */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Endereço</label>
          <input
            type="text"
            placeholder="Rua, número, bairro..."
            value={form.address ?? ''}
            onChange={e => set('address', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Link Google Maps</label>
            <input
              type="url"
              placeholder="https://maps.google.com/..."
              value={form.maps_url ?? ''}
              onChange={e => set('maps_url', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Website</label>
            <input
              type="url"
              placeholder="https://"
              value={form.website_url ?? ''}
              onChange={e => set('website_url', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Notas */}
        <textarea
          placeholder="Notas, dicas, horários..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
        />

        {/* Favorito */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.is_favorite}
            onChange={e => set('is_favorite', e.target.checked)}
            className="w-4 h-4 accent-amber-400"
          />
          <span className="text-sm">⭐ Marcar como favorito</span>
        </label>

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border text-sm font-medium text-zinc-600">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name?.trim()}
            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
