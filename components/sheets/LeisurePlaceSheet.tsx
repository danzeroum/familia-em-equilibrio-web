'use client'
import { useState, useEffect } from 'react'
import type { LeisurePlace, LeisurePlaceCategory } from '@/types/database'

const PLACE_CATEGORIES: { value: LeisurePlaceCategory; label: string; emoji: string }[] = [
  { value: 'parque',      label: 'Parque',      emoji: '🌳' },
  { value: 'praia',       label: 'Praia',       emoji: '🏖️' },
  { value: 'restaurante', label: 'Restaurante', emoji: '🍴' },
  { value: 'cinema',      label: 'Cinema',      emoji: '🎬' },
  { value: 'teatro',      label: 'Teatro',      emoji: '🎭' },
  { value: 'museu',       label: 'Museu',       emoji: '🏛️' },
  { value: 'esporte',     label: 'Esporte',     emoji: '⚽' },
  { value: 'viagem',      label: 'Viagem',      emoji: '✈️' },
  { value: 'clube',       label: 'Clube',       emoji: '🎞️' },
  { value: 'outros',      label: 'Outros',      emoji: '📍' },
]

interface Member {
  id: string
  name: string
}

interface Props {
  open: boolean
  onClose: () => void
  item: LeisurePlace | null
  onSave: (payload: Partial<LeisurePlace>) => Promise<void>
  members: Member[]
}

export function LeisurePlaceSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<LeisurePlace>>({})
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (item) {
      setForm(item)
    } else {
      setForm({ category: 'outros', is_favorite: false, visited_count: 0, tags: [] })
    }
    setTagInput('')
  }, [item, open])

  const set = (key: keyof LeisurePlace, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }))

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t) return
    const current = form.tags ?? []
    if (!current.includes(t)) set('tags', [...current, t])
    setTagInput('')
  }

  const removeTag = (tag: string) =>
    set('tags', (form.tags ?? []).filter((t) => t !== tag))

  const handleSave = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {item ? 'Editar Lugar' : 'Novo Lugar'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Emoji + Nome */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="📍"
              maxLength={2}
              value={form.emoji ?? ''}
              onChange={(e) => set('emoji', e.target.value)}
              className="w-14 text-center border rounded-lg p-2 text-xl"
            />
            <input
              type="text"
              placeholder="Nome do lugar *"
              value={form.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
              className="flex-1 border rounded-lg p-2"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {PLACE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => set('category', c.value)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.category === c.value
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <input
              type="text"
              placeholder="Endereço completo"
              value={form.address ?? ''}
              onChange={(e) => set('address', e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Links */}
          <div className="space-y-2">
            <input
              type="url"
              placeholder="🗺️ Link Google Maps"
              value={form.maps_url ?? ''}
              onChange={(e) => set('maps_url', e.target.value)}
              className="w-full border rounded-lg p-2"
            />
            <input
              type="url"
              placeholder="🌐 Site / Instagram"
              value={form.website_url ?? ''}
              onChange={(e) => set('website_url', e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Notas */}
          <textarea
            placeholder="Notas sobre o lugar"
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            className="w-full border rounded-lg p-2 resize-none"
          />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="adicionar tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 border rounded-lg p-2 text-sm"
              />
              <button
                onClick={addTag}
                className="px-3 border rounded-lg text-sm hover:bg-gray-50"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {(form.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Favorito */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('is_favorite', !form.is_favorite)}
              className={`w-11 h-6 rounded-full transition-colors ${
                form.is_favorite ? 'bg-yellow-400' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${
                  form.is_favorite ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm">⭐ Lugar favorito</span>
          </label>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name?.trim()}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
