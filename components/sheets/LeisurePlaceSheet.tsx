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
  { value: 'parque', label: 'Parque', emoji: '🌳' },
  { value: 'praia', label: 'Praia', emoji: '🏖️' },
  { value: 'restaurante', label: 'Restaurante', emoji: '🍽️' },
  { value: 'cinema', label: 'Cinema', emoji: '🎬' },
  { value: 'teatro', label: 'Teatro', emoji: '🎭' },
  { value: 'museu', label: 'Museu', emoji: '🏛️' },
  { value: 'esporte', label: 'Esporte', emoji: '⚽' },
  { value: 'viagem', label: 'Viagem', emoji: '✈️' },
  { value: 'clube', label: 'Clube', emoji: '🎪' },
  { value: 'outros', label: 'Outros', emoji: '📍' },
]

export function LeisurePlaceSheet({ open, onClose, item, onSave }: Props) {
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
      setName(item.name); setEmoji(item.emoji ?? '📍')
      setCategory((item.category as LeisurePlaceCategory) ?? 'outros')
      setAddress(item.address ?? ''); setMapsUrl(item.maps_url ?? '')
      setWebsiteUrl(item.website_url ?? ''); setNotes(item.notes ?? '')
      setIsFavorite(item.is_favorite); setTags(item.tags.join(', '))
    } else {
      setName(''); setEmoji('📍'); setCategory('outros')
      setAddress(''); setMapsUrl(''); setWebsiteUrl('')
      setNotes(''); setIsFavorite(false); setTags('')
    }
  }, [item, open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      name: name.trim(), emoji, category,
      address: address || null,
      maps_url: mapsUrl || null,
      website_url: websiteUrl || null,
      notes: notes || null,
      is_favorite: isFavorite,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setSaving(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item ? 'Editar Lugar' : 'Novo Lugar'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">×</button>
        </div>

        <div className="flex gap-2">
          <input
            className="border rounded-lg p-2 w-16 text-2xl text-center"
            value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2}
          />
          <input
            className="border rounded-lg p-2 flex-1"
            placeholder="Nome do lugar"
            value={name} onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {PLACE_CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  category === c.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-zinc-200 hover:border-teal-400'
                }`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        <input
          className="border rounded-lg p-2 w-full text-sm"
          placeholder="Endereço"
          value={address} onChange={e => setAddress(e.target.value)}
        />
        <input
          className="border rounded-lg p-2 w-full text-sm"
          placeholder="🗺️ Link do Google Maps"
          value={mapsUrl} onChange={e => setMapsUrl(e.target.value)}
        />
        <input
          className="border rounded-lg p-2 w-full text-sm"
          placeholder="🌐 Site"
          value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
        />
        <textarea
          className="border rounded-lg p-2 w-full text-sm"
          rows={2}
          placeholder="Observações"
          value={notes} onChange={e => setNotes(e.target.value)}
        />
        <input
          className="border rounded-lg p-2 w-full text-sm"
          placeholder="Tags: família, gratuito, ao ar livre..."
          value={tags} onChange={e => setTags(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isFavorite} onChange={e => setIsFavorite(e.target.checked)} />
          ⭐ Favorito
        </label>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm hover:bg-zinc-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
