'use client'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { LeisureActivity, LeisureCategory, LeisurePriority } from '@/types/database'

const CATEGORIES: { value: LeisureCategory; label: string; emoji: string }[] = [
  { value: 'passeio',        label: 'Passeio',        emoji: '🚶' },
  { value: 'viagem',         label: 'Viagem',         emoji: '✈️' },
  { value: 'esporte',        label: 'Esporte',        emoji: '⚽' },
  { value: 'cultura',        label: 'Cultura',        emoji: '🎭' },
  { value: 'entretenimento', label: 'Entretenimento', emoji: '🎬' },
  { value: 'natureza',       label: 'Natureza',       emoji: '🌿' },
  { value: 'social',         label: 'Social',         emoji: '👥' },
  { value: 'educativo',      label: 'Educativo',      emoji: '📚' },
  { value: 'outros',         label: 'Outros',         emoji: '🎉' },
]

const PRIORITIES: { value: LeisurePriority; label: string; color: string }[] = [
  { value: 'alta',  label: 'Alta',  color: 'text-red-500' },
  { value: 'media', label: 'Média', color: 'text-yellow-500' },
  { value: 'baixa', label: 'Baixa', color: 'text-green-500' },
]

interface Member { id: string; nickname?: string | null; name: string; emoji?: string | null }

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureActivity | null
  onSave: (payload: Partial<LeisureActivity>) => Promise<void>
  members: Member[]
  onConvertToTask?: (activity: LeisureActivity) => Promise<void>
  onConvertToEvent?: (activity: LeisureActivity, date: string) => Promise<void>
}

export function LeisureActivitySheet({ open, onClose, item, onSave, members, onConvertToTask, onConvertToEvent }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<LeisureCategory>('outros')
  const [emoji, setEmoji] = useState('🎉')
  const [forChildren, setForChildren] = useState(false)
  const [forAdults, setForAdults] = useState(true)
  const [estimatedCost, setEstimatedCost] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const [priority, setPriority] = useState<LeisurePriority>('media')
  const [tags, setTags] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setDescription(item.description ?? '')
      setCategory(item.category ?? 'outros')
      setEmoji(item.emoji ?? '🎉')
      setForChildren(item.for_children)
      setForAdults(item.for_adults)
      setEstimatedCost(item.estimated_cost?.toString() ?? '')
      setDurationHours(item.duration_hours?.toString() ?? '')
      setLocationName(item.location_name ?? '')
      setLocationUrl(item.location_url ?? '')
      setPriority(item.priority)
      setTags(item.tags.join(', '))
    } else {
      setTitle(''); setDescription(''); setCategory('outros'); setEmoji('🎉')
      setForChildren(false); setForAdults(true); setEstimatedCost(''); setDurationHours('')
      setLocationName(''); setLocationUrl(''); setPriority('media'); setTags('')
    }
    setShowEventPicker(false)
    setEventDate('')
  }, [item, open])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      id: item?.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      emoji,
      for_children: forChildren,
      for_adults: forAdults,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      duration_hours: durationHours ? parseFloat(durationHours) : null,
      location_name: locationName.trim() || null,
      location_url: locationUrl.trim() || null,
      priority,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setSaving(false)
    onClose()
  }

  const handleConvertToEvent = async () => {
    if (!item || !eventDate || !onConvertToEvent) return
    setSaving(true)
    await onConvertToEvent(item, eventDate)
    setSaving(false)
    setShowEventPicker(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? 'Editar Atividade' : 'Nova Atividade de Lazer'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Emoji + Título */}
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
              placeholder="Nome da atividade"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 bg-background text-sm"
            />
          </div>

          {/* Descrição */}
          <textarea
            placeholder="Descrição (opcional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="border rounded-lg px-3 py-2 bg-background text-sm resize-none"
          />

          {/* Categoria */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-colors ${
                    category === c.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Para quem */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Para quem</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={forAdults} onChange={e => setForAdults(e.target.checked)} />
                👨 Adultos
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={forChildren} onChange={e => setForChildren(e.target.checked)} />
                👶 Crianças
              </label>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prioridade</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    priority === p.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custo e duração */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Custo estimado (R$)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={e => setEstimatedCost(e.target.value)}
                placeholder="0,00"
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Duração (horas)</label>
              <input
                type="number"
                value={durationHours}
                onChange={e => setDurationHours(e.target.value)}
                placeholder="2"
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              />
            </div>
          </div>

          {/* Localização */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Local</label>
            <input
              type="text"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder="Nome do local"
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm mb-2"
            />
            <input
              type="url"
              value={locationUrl}
              onChange={e => setLocationUrl(e.target.value)}
              placeholder="Link (Google Maps, site…)"
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="praia, verão, família"
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
            />
          </div>

          {/* Conversão — só aparece quando editando item existente */}
          {item && (
            <div className="border rounded-xl p-3 bg-muted/40 flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Converter em</p>
              <div className="flex gap-2">
                {!item.task_id && onConvertToTask && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => { setSaving(true); await onConvertToTask(item); setSaving(false); onClose() }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-background border text-xs font-medium hover:bg-muted transition-colors"
                  >
                    ⚡ Tarefa
                  </button>
                )}
                {item.task_id && (
                  <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-300">
                    ✅ Tarefa criada
                  </div>
                )}
                {!item.event_id && onConvertToEvent && !showEventPicker && (
                  <button
                    type="button"
                    onClick={() => setShowEventPicker(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-background border text-xs font-medium hover:bg-muted transition-colors"
                  >
                    📅 Agendar
                  </button>
                )}
                {item.event_id && (
                  <div className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                    📅 Agendado
                  </div>
                )}
              </div>
              {showEventPicker && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-1.5 bg-background text-sm"
                  />
                  <button
                    type="button"
                    disabled={!eventDate || saving}
                    onClick={handleConvertToEvent}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEventPicker(false)}
                    className="px-2 py-1.5 rounded-lg border text-xs hover:bg-muted"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

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
              disabled={!title.trim() || saving}
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
