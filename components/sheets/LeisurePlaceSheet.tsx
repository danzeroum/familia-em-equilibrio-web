'use client'

import { useState, useEffect } from 'react'
import { SlideOver, Field, SaveCancel } from './_shared'
import type { LeisurePlace, LeisurePlaceCategory } from '@/types/database'

const CATEGORIES: { value: LeisurePlaceCategory; label: string }[] = [
  { value: 'parque', label: '🌳 Parque' },
  { value: 'praia', label: '🏖️ Praia' },
  { value: 'restaurante', label: '🍽️ Restaurante' },
  { value: 'cinema', label: '🎬 Cinema' },
  { value: 'teatro', label: '🎭 Teatro' },
  { value: 'museu', label: '🏛️ Museu' },
  { value: 'esporte', label: '⚽ Esporte' },
  { value: 'viagem', label: '✈️ Viagem' },
  { value: 'clube', label: '🎉 Clube' },
  { value: 'outros', label: '📦 Outros' },
]

interface Props {
  open: boolean
  onClose: () => void
  item: LeisurePlace | null
  onSave: (payload: Partial<LeisurePlace>) => Promise<void>
  members: { id: string; name: string; nickname?: string | null }[]
}

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
      setName(item.name)
      setEmoji(item.emoji ?? '📍')
      setCategory((item.category as LeisurePlaceCategory) ?? 'outros')
      setAddress(item.address ?? '')
      setMapsUrl(item.maps_url ?? '')
      setWebsiteUrl(item.website_url ?? '')
      setNotes(item.notes ?? '')
      setIsFavorite(item.is_favorite)
      setTags(item.tags?.join(', ') ?? '')
    } else {
      setName('')
      setEmoji('📍')
      setCategory('outros')
      setAddress('')
      setMapsUrl('')
      setWebsiteUrl('')
      setNotes('')
      setIsFavorite(false)
      setTags('')
    }
  }, [item, open])

  if (!open) return null

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      ...(item ? { id: item.id } : {}),
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
    <SlideOver title={item ? 'Editar Lugar' : 'Novo Lugar'} onClose={onClose}>
      <div className="flex gap-2">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Emoji</label>
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            className="input-base w-16 text-center text-xl"
            maxLength={2}
          />
        </div>
        <div className="flex-1">
          <Field label="Nome" value={name} onChange={setName} placeholder="ex: Parque Estadual da Serra do Mar" />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Categoria</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value as LeisurePlaceCategory)}
          className="input-base"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <Field label="Endereço" value={address} onChange={setAddress} placeholder="Rua, cidade, estado" />
      <Field label="Link Google Maps" value={mapsUrl} onChange={setMapsUrl} placeholder="https://maps.google.com/..." />
      <Field label="Site" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://..." />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Notas</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Dicas, horários, observações..."
          rows={2}
          className="input-base resize-none"
        />
      </div>

      <Field label="Tags (separadas por vírgula)" value={tags} onChange={setTags} placeholder="ex: família, gratuito, ao ar livre" />

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setIsFavorite(!isFavorite)}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            isFavorite ? 'bg-yellow-400' : 'bg-gray-200'
          }`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            isFavorite ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </div>
        <span className="text-sm text-gray-700">⭐ Marcar como favorito</span>
      </label>

      <SaveCancel onSave={handleSave} onClose={onClose} saving={saving} />
    </SlideOver>
  )
}
