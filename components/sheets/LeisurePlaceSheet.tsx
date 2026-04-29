'use client'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
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

interface Member { id: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
  item: LeisurePlace | null
  onSave: (payload: Partial<LeisurePlace>) => Promise<void>
  members: Member[]
}

export function LeisurePlaceSheet({ open, onClose, item, onSave, members }: Props) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<LeisurePlaceCategory>('outros')
  const [emoji, setEmoji] = useState('📍')
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
      setCategory(item.category ?? 'outros')
      setEmoji(item.emoji ?? '📍')
      setAddress(item.address ?? '')
      setMapsUrl(item.maps_url ?? '')
      setWebsiteUrl(item.website_url ?? '')
      setNotes(item.notes ?? '')
      setIsFavorite(item.is_favorite)
      setTags(item.tags.join(', '))
    } else {
      setName(''); setCategory('outros'); setEmoji('📍'); setAddress('')
      setMapsUrl(''); setWebsiteUrl(''); setNotes(''); setIsFavorite(false); setTags('')
    }
  }, [item, open])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      id: item?.id,
      name: name.trim(),
      category,
      emoji,
      address: address.trim() || null,
      maps_url: mapsUrl.trim() || null,
      website_url: websiteUrl.trim() || null,
      notes: notes.trim() || null,
      is_favorite: isFavorite,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setSaving(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? 'Editar Lugar' : 'Novo Lugar'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Emoji + Nome */}
          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              className="w-14 text-center text-2xl border rounded-lg p-2 bg-background"
              maxLength={4}
            />
            <input
              type="text"
              placeholder="Nome do lugar"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 bg-background text-sm"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
            <div className="grid grid-cols-5 gap-1.5">
              {PLACE_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-0.5 px-1 py-2 rounded-lg border text-xs transition-colors ${
                    category === c.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  <span className="text-[10px] leading-tight text-center">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Endereço</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Rua, bairro, cidade…"
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
            />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">🗺️ Link Google Maps</label>
              <input
                type="url"
                value={mapsUrl}
                onChange={e => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/…"
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">🌐 Website</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://…"
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              />
            </div>
          </div>

          {/* Notas */}
          <textarea
            placeholder="Observações, dicas, horários…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="border rounded-lg px-3 py-2 bg-background text-sm resize-none"
          />

          {/* Tags */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="crianças, gratuito, fim de semana"
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
            />
          </div>

          {/* Favorito */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsFavorite(!isFavorite)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                isFavorite ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                isFavorite ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className="text-sm">⭐ Lugar favorito</span>
          </label>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!name.trim() || saving}
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? 'Salvando…' : item ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
