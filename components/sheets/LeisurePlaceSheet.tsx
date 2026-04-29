'use client'
import { useState, useEffect } from 'react'
import type { LeisurePlace, LeisurePlaceCategory, Profile } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: LeisurePlace | null
  onSave: (payload: Partial<LeisurePlace>) => Promise<void>
  members: Profile[]
}

const PLACE_CATEGORIES: { value: LeisurePlaceCategory; label: string; emoji: string }[] = [
  { value: 'parque',      label: 'Parque',      emoji: '🌳' },
  { value: 'praia',       label: 'Praia',       emoji: '🏖️' },
  { value: 'restaurante', label: 'Restaurante', emoji: '🍽️' },
  { value: 'cinema',      label: 'Cinema',      emoji: '🎥' },
  { value: 'teatro',      label: 'Teatro',      emoji: '🎭' },
  { value: 'museu',       label: 'Museu',       emoji: '🏛️' },
  { value: 'esporte',     label: 'Esporte',     emoji: '🏋️' },
  { value: 'viagem',      label: 'Viagem',      emoji: '✈️' },
  { value: 'clube',       label: 'Clube',       emoji: '🏢' },
  { value: 'outros',      label: 'Outros',      emoji: '📍' },
]

export function LeisurePlaceSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<LeisurePlace>>({})
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (open) {
      setForm(item ?? {
        category: 'outros',
        is_favorite: false,
        visited_count: 0,
        tags: [],
      })
    }
  }, [open, item])

  if (!open) return null

  const set = (key: keyof LeisurePlace, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    const tags = form.tags ?? []
    if (!tags.includes(t)) set('tags', [...tags, t])
    setTagInput('')
  }

  const removeTag = (tag: string) =>
    set('tags', (form.tags ?? []).filter(t => t !== tag))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {item ? 'Editar Lugar' : 'Salvar Lugar'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">×</button>
        </div>

        <div className="space-y-4">
          {/* Emoji + Nome */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="📍"
              value={form.emoji ?? ''}
              onChange={e => set('emoji', e.target.value)}
              className="w-14 text-center border rounded-lg px-2 py-2 text-xl"
              maxLength={4}
            />
            <input
              type="text"
              placeholder="Nome do lugar *"
              value={form.name ?? ''}
              onChange={e => set('name', e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {PLACE_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => set('category', cat.value)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.category === cat.value
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-zinc-300 hover:border-teal-400'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <input
              type="text"
              placeholder="Rua, cidade..."
              value={form.address ?? ''}
              onChange={e => set('address', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Google Maps</label>
              <input
                type="url"
                placeholder="https://maps.google..."
                value={form.maps_url ?? ''}
                onChange={e => set('maps_url', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.website_url ?? ''}
                onChange={e => set('website_url', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Notas */}
          <textarea
            placeholder="Notas, dicas, observações..."
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 resize-none"
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-zinc-100 rounded-lg text-sm hover:bg-zinc-200"
              >
                +
              </button>
            </div>
            {(form.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(form.tags ?? []).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Favorito */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('is_favorite', !form.is_favorite)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                form.is_favorite ? 'bg-yellow-400' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.is_favorite ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="text-sm">⭐ Lugar favorito</span>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg text-sm hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name?.trim()}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : item ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
