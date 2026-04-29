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
import type { LeisureActivity } from '@/types/database'
import type { Profile } from '@/types/database'

const CATEGORIES = [
  { value: 'passeio',        label: '🚶 Passeio' },
  { value: 'viagem',         label: '✈️ Viagem' },
  { value: 'esporte',        label: '⚽ Esporte' },
  { value: 'cultura',        label: '🎭 Cultura' },
  { value: 'entretenimento', label: '🎮 Entretenimento' },
  { value: 'natureza',       label: '🌿 Natureza' },
  { value: 'social',         label: '👥 Social' },
  { value: 'educativo',      label: '📚 Educativo' },
  { value: 'outros',         label: '🎯 Outros' },
]

const PRIORITIES = [
  { value: 'alta',  label: '🔴 Alta' },
  { value: 'media', label: '🟡 Média' },
  { value: 'baixa', label: '🟢 Baixa' },
]

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureActivity | null
  onSave: (payload: Partial<LeisureActivity>) => Promise<void>
  members: Profile[]
  onConvertToTask?: (activity: LeisureActivity) => Promise<void>
  onConvertToEvent?: (activity: LeisureActivity, date: string) => Promise<void>
}

export function LeisureActivitySheet({
  open, onClose, item, onSave, members, onConvertToTask, onConvertToEvent,
}: Props) {
  const [form, setForm] = useState<Partial<LeisureActivity>>({})
  const [eventDate, setEventDate] = useState('')
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (open) {
      setForm(item ?? {
        status: 'wishlist',
        priority: 'media',
        for_adults: true,
        for_children: false,
        tags: [],
        category: 'outros',
      })
      setTagInput('')
      setShowEventPicker(false)
      setEventDate('')
    }
  }, [open, item])

  const set = (key: keyof LeisureActivity, value: unknown) =>
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
    if (!form.title?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const handleConvertTask = async () => {
    if (!item || !onConvertToTask) return
    setSaving(true)
    await onConvertToTask(item)
    setSaving(false)
    onClose()
  }

  const handleConvertEvent = async () => {
    if (!item || !onConvertToEvent || !eventDate) return
    setSaving(true)
    await onConvertToEvent(item, eventDate)
    setSaving(false)
    setShowEventPicker(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? 'Editar Atividade' : 'Nova Atividade de Lazer'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Emoji + Título */}
          <div className="flex gap-2">
            <Input
              className="w-16 text-center text-xl"
              value={form.emoji ?? ''}
              onChange={(e) => set('emoji', e.target.value)}
              placeholder="🎉"
            />
            <Input
              className="flex-1"
              placeholder="Nome da atividade"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          {/* Categoria + Prioridade */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category ?? 'outros'} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority ?? 'media'} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label>Descrição</Label>
            <Textarea
              placeholder="Detalhes da atividade..."
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Para quem */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="for_adults"
                checked={form.for_adults ?? true}
                onCheckedChange={(v) => set('for_adults', v)}
              />
              <Label htmlFor="for_adults">👨 Adultos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="for_children"
                checked={form.for_children ?? false}
                onCheckedChange={(v) => set('for_children', v)}
              />
              <Label htmlFor="for_children">👦 Crianças</Label>
            </div>
          </div>

          {/* Custo + Duração */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Custo estimado (R$)</Label>
              <Input
                type="number"
                placeholder="0,00"
                value={form.estimated_cost ?? ''}
                onChange={(e) => set('estimated_cost', parseFloat(e.target.value) || null)}
              />
            </div>
            <div>
              <Label>Duração (horas)</Label>
              <Input
                type="number"
                placeholder="2"
                value={form.duration_hours ?? ''}
                onChange={(e) => set('duration_hours', parseFloat(e.target.value) || null)}
              />
            </div>
          </div>

          {/* Local */}
          <div>
            <Label>Local</Label>
            <Input
              placeholder="Nome do local"
              value={form.location_name ?? ''}
              onChange={(e) => set('location_name', e.target.value)}
            />
          </div>
          <div>
            <Label>Link (Maps / Site)</Label>
            <Input
              placeholder="https://"
              value={form.location_url ?? ''}
              onChange={(e) => set('location_url', e.target.value)}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar tag"
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

          {/* Conversão — só aparece ao editar */}
          {item && (
            <div className="border rounded-lg p-3 flex flex-col gap-2 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">Converter em...</p>
              <div className="flex gap-2">
                {!item.task_id && onConvertToTask && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleConvertTask}
                    disabled={saving}
                  >
                    ⚡ Criar Tarefa
                  </Button>
                )}
                {item.task_id && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    ✅ Tarefa criada
                  </span>
                )}
                {!item.event_id && onConvertToEvent && !showEventPicker && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowEventPicker(true)}
                  >
                    📅 Agendar
                  </Button>
                )}
                {item.event_id && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    📅 Evento agendado
                  </span>
                )}
              </div>
              {showEventPicker && (
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleConvertEvent} disabled={!eventDate || saving}>
                    Confirmar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowEventPicker(false)}>
                    ✕
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !form.title?.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
