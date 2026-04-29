'use client'
import { useEffect, useState } from 'react'
import type { LeisureActivity, LeisureCategory, LeisurePriority } from '@/types/database'
import type { Profile } from '@/types/database'

const CATEGORIES: { value: LeisureCategory; label: string; emoji: string }[] = [
  { value: 'passeio',        label: 'Passeio',        emoji: '🚶' },
  { value: 'viagem',         label: 'Viagem',         emoji: '✈️' },
  { value: 'esporte',        label: 'Esporte',        emoji: '⚽' },
  { value: 'cultura',        label: 'Cultura',        emoji: '🎭' },
  { value: 'entretenimento', label: 'Entretenimento', emoji: '🎬' },
  { value: 'natureza',       label: 'Natureza',       emoji: '🌿' },
  { value: 'social',         label: 'Social',         emoji: '👥' },
  { value: 'educativo',      label: 'Educativo',      emoji: '📚' },
  { value: 'outros',         label: 'Outros',         emoji: '✨' },
]

const PRIORITIES: { value: LeisurePriority; label: string; color: string }[] = [
  { value: 'alta',  label: 'Alta',  color: 'text-red-500' },
  { value: 'media', label: 'Média', color: 'text-yellow-500' },
  { value: 'baixa', label: 'Baixa', color: 'text-green-500' },
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

export function LeisureActivitySheet({ open, onClose, item, onSave, members, onConvertToTask, onConvertToEvent }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [category, setCategory] = useState<LeisureCategory>('outros')
  const [priority, setPriority] = useState<LeisurePriority>('media')
  const [forChildren, setForChildren] = useState(false)
  const [forAdults, setForAdults] = useState(true)
  const [estimatedCost, setEstimatedCost] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [eventDate, setEventDate] = useState('')
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setDescription(item.description ?? '')
      setEmoji(item.emoji ?? '🎉')
      setCategory(item.category ?? 'outros')
      setPriority(item.priority)
      setForChildren(item.for_children)
      setForAdults(item.for_adults)
      setEstimatedCost(item.estimated_cost?.toString() ?? '')
      setDurationHours(item.duration_hours?.toString() ?? '')
      setLocationName(item.location_name ?? '')
      setLocationUrl(item.location_url ?? '')
      setTags(item.tags ?? [])
    } else {
      setTitle('')
      setDescription('')
      setEmoji('🎉')
      setCategory('outros')
      setPriority('media')
      setForChildren(false)
      setForAdults(true)
      setEstimatedCost('')
      setDurationHours('')
      setLocationName('')
      setLocationUrl('')
      setTags([])
    }
  }, [item, open])

  if (!open) return null

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      title: title.trim(),
      description: description.trim() || null,
      emoji,
      category,
      priority,
      for_children: forChildren,
      for_adults: forAdults,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      duration_hours: durationHours ? parseFloat(durationHours) : null,
      location_name: locationName.trim() || null,
      location_url: locationUrl.trim() || null,
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item ? 'Editar Atividade' : 'Nova Atividade'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">✕</button>
        </div>

        {/* Emoji + Título */}
        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            className="w-14 text-center border rounded-xl p-2 text-xl"
            maxLength={2}
          />
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nome da atividade..."
            className="flex-1 border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {/* Descrição */}
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descrição (opcional)"
          rows={2}
          className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
        />

        {/* Categoria */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
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

        {/* Prioridade */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Prioridade</label>
          <div className="flex gap-2">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                className={`flex-1 py-1.5 rounded-xl text-xs border transition-colors ${
                  priority === p.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'border-zinc-200 text-zinc-600 hover:border-teal-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Para quem */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={forAdults} onChange={e => setForAdults(e.target.checked)} className="rounded" />
            👨 Adultos
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={forChildren} onChange={e => setForChildren(e.target.checked)} className="rounded" />
            👦 Crianças
          </label>
        </div>

        {/* Custo e Duração */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Custo estimado (R$)</label>
            <input
              type="number"
              value={estimatedCost}
              onChange={e => setEstimatedCost(e.target.value)}
              placeholder="0,00"
              className="w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Duração (horas)</label>
            <input
              type="number"
              value={durationHours}
              onChange={e => setDurationHours(e.target.value)}
              placeholder="2"
              className="w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Local */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Local</label>
          <input
            value={locationName}
            onChange={e => setLocationName(e.target.value)}
            placeholder="Nome do local"
            className="w-full border rounded-xl px-3 py-2 text-sm mb-2"
          />
          <input
            value={locationUrl}
            onChange={e => setLocationUrl(e.target.value)}
            placeholder="Link (Maps, site...)"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
        </div>

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
              placeholder="Adicionar tag..."
              className="flex-1 border rounded-xl px-3 py-1.5 text-sm"
            />
            <button onClick={addTag} className="px-3 py-1.5 bg-zinc-100 rounded-xl text-sm hover:bg-zinc-200">+</button>
          </div>
        </div>

        {/* Conversão — só aparece ao editar */}
        {item && (onConvertToTask || onConvertToEvent) && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Converter em</p>
            <div className="flex gap-2">
              {onConvertToTask && !item.task_id && (
                <button
                  onClick={async () => { await onConvertToTask(item); onClose() }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm hover:bg-blue-100 transition-colors"
                >
                  ✅ Tarefa
                </button>
              )}
              {item.task_id && (
                <span className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm opacity-60">
                  ✅ Tarefa criada
                </span>
              )}
              {onConvertToEvent && !item.event_id && (
                <button
                  onClick={() => setShowEventPicker(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm hover:bg-purple-100 transition-colors"
                >
                  📅 Agendar
                </button>
              )}
              {item.event_id && (
                <span className="flex-1 flex items-center justify-center gap-1 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm opacity-60">
                  📅 Agendado
                </span>
              )}
            </div>
            {showEventPicker && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="flex-1 border rounded-xl px-3 py-2 text-sm"
                />
                <button
                  onClick={async () => {
                    if (eventDate && onConvertToEvent) {
                      await onConvertToEvent(item, eventDate)
                      setShowEventPicker(false)
                      onClose()
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-zinc-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
