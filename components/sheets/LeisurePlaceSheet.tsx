'use client'
import { useEffect, useState } from 'react'
import type { LeisurePlace, LeisurePlaceCategory } from '@/types/database'
import type { Profile } from '@/types/database'

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

interface Props {
  open: boolean
  onClose: () => void
  item: LeisurePlace | null
  onSave: (payload: Partial<LeisurePlace>) => Promise<void>
  members: Profile[]
}

export function LeisurePlaceSheet({ open, onClose, item, onSave, members }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📍')
  const [category, setCategory] = useState<LeisurePlaceCategory>('outros')
  const [address, setAddress] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setName(item.name)
      setEmoji(item.emoji ?? '📍')
      setCategory((item.category as LeisurePlaceCategory) ?? 'outros')
      setAddress(item.address ?? '')
      setMapsUrl(item.maps_url ?? '')
      setWebsiteUrl(item.website_url ?? '')
      setNotes(item.notes ?? '')
      setIsFavorite(item.is_favorite)
      setTags(item.tags ?? [])
    } else {
      setName('')
      setEmoji('📍')
      setCategory('outros')
      setAddress('')
      setMapsUrl('')
      setWebsiteUrl('')
      setNotes('')
      setIsFavorite(false)
      setTags([])
    }
  }, [item, open])

  if (!open) return null

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      name: name.trim(),
      emoji,
      category,
      address: address.trim() || null,
      maps_url: mapsUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      notes: notes.trim() || null,
      is_favorite: isFavorite,
      tags,
    })
    setSaving(false)
    onClose()
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item ? 'Editar Lugar' : 'Novo Lugar'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">✕</button>
        </div>

        {/* Emoji + Nome */}
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            className="w-14 text-center border rounded-xl p-2 text-xl"
            maxLength={2}
          />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nome do lugar..."
            className="flex-1 border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {PLACE_CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  category === c.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-zinc-200 text-zinc-600 hover:border-teal-400'
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
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Rua, bairro, cidade..."
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {/* Links */}
        <div className="space-y-2">
          <input
            value={mapsUrl}
            onChange={e => setMapsUrl(e.target.value)}
            placeholder="🗺️ Link Google Maps"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            placeholder="🌐 Site / Instagram"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {/* Notas */}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anotações, dicas..."
          rows={2}
          className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
        />

        {/* Favorito */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setIsFavorite(!isFavorite)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
              isFavorite ? 'bg-yellow-400' : 'bg-zinc-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isFavorite ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
          <span className="text-sm">⭐ Lugar favorito</span>
        </label>

        {/* Tags */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Tags</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {tags.map(t => (
              <span key={t} className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                {t}
                <button onClick={() => setTags(tags.filter(x => x !== t))} className="hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
              placeholder="criança-friendly, gratuito..."
              className="flex-1 border rounded-xl px-3 py-1.5 text-sm"
            />
            <button onClick={addTag} className="px-3 py-1.5 bg-zinc-100 rounded-xl text-sm hover:bg-zinc-200">+</button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-zinc-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
