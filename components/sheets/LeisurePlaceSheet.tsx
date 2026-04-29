'use client'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { LeisurePlace, Profile } from '@/types/database'

const PLACE_CATEGORIES = [
  { value: 'parque',      label: '🌳 Parque' },
  { value: 'praia',       label: '🏖️ Praia' },
  { value: 'restaurante', label: '🍽️ Restaurante' },
  { value: 'cinema',      label: '🎬 Cinema' },
  { value: 'teatro',      label: '🎭 Teatro' },
  { value: 'museu',       label: '🏛️ Museu' },
  { value: 'esporte',     label: '⚽ Esporte' },
  { value: 'viagem',      label: '✈️ Viagem' },
  { value: 'clube',       label: '🏊 Clube' },
  { value: 'outros',      label: '📍 Outros' },
]

interface Props {
  open: boolean
  onClose: () => void
  item: LeisurePlace | null
  onSave: (payload: Partial<LeisurePlace>) => Promise<void>
  members: Profile[]
}

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
      setTagInput('')
    }
  }, [open, item])

  const set = (key: keyof LeisurePlace, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const addTag = () => {
    const tag = tagInput.trim()
    if (!tag) return
    set('tags', [...(form.tags ?? []), tag])
    setTagInput('')
  }

  const removeTag = (t: string) =>
    set('tags', (form.tags ?? []).filter((x) => x !== t))

  const handleSave = async () => {
    if (!form.name?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? 'Editar Lugar' : 'Novo Lugar Favorito'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Emoji + Nome */}
          <div className="flex gap-2">
            <Input
              className="w-16 text-center text-xl"
              value={form.emoji ?? ''}
              onChange={(e) => set('emoji', e.target.value)}
              placeholder="📍"
            />
            <Input
              className="flex-1"
              placeholder="Nome do lugar"
              value={form.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
            />
          </div>

          {/* Categoria */}
          <div>
            <Label>Categoria</Label>
            <Select
              value={form.category ?? 'outros'}
              onValueChange={(v) => set('category', v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLACE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Endereço */}
          <div>
            <Label>Endereço</Label>
            <Input
              placeholder="Rua, Bairro, Cidade..."
              value={form.address ?? ''}
              onChange={(e) => set('address', e.target.value)}
            />
          </div>

          {/* Links */}
          <div>
            <Label>Link Google Maps</Label>
            <Input
              placeholder="https://maps.google.com/..."
              value={form.maps_url ?? ''}
              onChange={(e) => set('maps_url', e.target.value)}
            />
          </div>
          <div>
            <Label>Website</Label>
            <Input
              placeholder="https://"
              value={form.website_url ?? ''}
              onChange={(e) => set('website_url', e.target.value)}
            />
          </div>

          {/* Notas */}
          <div>
            <Label>Notas</Label>
            <Textarea
              placeholder="Observações sobre o lugar..."
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: kids, gratuito, perto"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>+</Button>
            </div>
            {(form.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(form.tags ?? []).map((t) => (
                  <span
                    key={t}
                    className="text-xs bg-muted px-2 py-1 rounded-full flex items-center gap-1 cursor-pointer"
                    onClick={() => removeTag(t)}
                  >
                    {t} ✕
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Favorito */}
          <div className="flex items-center gap-3">
            <Switch
              id="is_favorite"
              checked={form.is_favorite ?? false}
              onCheckedChange={(v) => set('is_favorite', v)}
            />
            <Label htmlFor="is_favorite">⭐ Lugar favorito</Label>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !form.name?.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
