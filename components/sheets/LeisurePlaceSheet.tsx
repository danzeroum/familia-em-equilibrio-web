'use client'
import { useState, useEffect } from 'react'
import type { LeisurePlace, LeisurePlaceCategory } from '@/types/database'

interface Member {
  id: string
  name: string
  nickname?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  item: LeisurePlace | null
  onSave: (payload: Partial<LeisurePlace>) => Promise<void>
  members: Member[]
}

const PLACE_CATEGORIES: { value: LeisurePlaceCategory; label: string; emoji: string }[] = [
  { value: 'parque', label: 'Parque', emoji: '🌳' },
  { value: 'praia', label: 'Praia', emoji: '🏖️' },
  { value: 'restaurante', label: 'Restaurante', emoji: '🍽️' },
  { value: 'cinema', label: 'Cinema', emoji: '🎬' },
  { value: 'teatro', label: 'Teatro', emoji: '🎭' },
  { value: 'museu', label: 'Museu', emoji: '🏛️' },
  { value: 'esporte', label: 'Esporte', emoji: '⚽' },
  { value: 'viagem', label: 'Viagem', emoji: '✈️' },
  { value: 'clube', label: 'Clube', emoji: '🏊' },
  { value: 'outros', label: 'Outros', emoji: '📍' },
]

export default function LeisurePlaceSheet({ open, onClose, item, onSave, members }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📍')
  const [category, setCategory] = useState<LeisurePlaceCategory>('outros')
  const [address, setAddress] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setName(item.name)
      setEmoji(item.emoji || '📍')
      setCategory((item.category as LeisurePlaceCategory) || 'outros')
      setAddress(item.address || '')
      setMapsUrl(item.maps_url || '')
      setWebsiteUrl(item.website_url || '')
      setNotes(item.notes || '')
      setIsFavorite(item.is_favorite)
      setTags((item.tags || []).join(', '))
    } else {
      setName(''); setEmoji('📍'); setCategory('outros')
      setAddress(''); setMapsUrl(''); setWebsiteUrl('')
      setNotes(''); setIsFavorite(false); setTags('')
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
      address: address || null,
      maps_url: mapsUrl || null,
      website_url: websiteUrl || null,
      notes: notes || null,
      is_favorite: isFavorite,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {item ? 'Editar Lugar' : 'Novo Lugar Favorito'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 p-1">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Emoji + Nome */}
          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              className="w-14 text-center text-2xl border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800"
              maxLength={4}
            />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do lugar"
              className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {PLACE_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-2 py-1 rounded-full text-xs border transition-colors ${
                    category === c.value
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Favorito */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsFavorite(!isFavorite)}
              className={`w-10 h-6 rounded-full transition-colors ${
                isFavorite ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-600'
              } relative`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                isFavorite ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">⭐ Lugar favorito</span>
          </label>

          {/* Endereço */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Endereço</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Rua, número, cidade"
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Google Maps</label>
              <input
                type="url"
                value={mapsUrl}
                onChange={e => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Site</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://"
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Notas */}
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Observações (horários, dicas, etc.)"
            rows={2}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100 resize-none"
          />

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="gratuito, crianças, ao ar livre"
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
