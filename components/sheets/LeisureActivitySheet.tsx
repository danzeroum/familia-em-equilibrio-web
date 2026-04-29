'use client'
import { useState, useEffect } from 'react'
import type { LeisureActivity, LeisureCategory, LeisurePriority } from '@/types/database'
import type { Profile } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureActivity | null
  onSave: (payload: Partial<LeisureActivity>) => Promise<void>
  members: Profile[]
  onConvertToTask?: (activity: LeisureActivity) => Promise<void>
  onConvertToEvent?: (activity: LeisureActivity, date: string) => Promise<void>
}

const CATEGORIES: { value: LeisureCategory; label: string; emoji: string }[] = [
  { value: 'passeio', label: 'Passeio', emoji: '🚶' },
  { value: 'viagem', label: 'Viagem', emoji: '✈️' },
  { value: 'esporte', label: 'Esporte', emoji: '⚽' },
  { value: 'cultura', label: 'Cultura', emoji: '🎭' },
  { value: 'entretenimento', label: 'Entretenimento', emoji: '🎬' },
  { value: 'natureza', label: 'Natureza', emoji: '🌿' },
  { value: 'social', label: 'Social', emoji: '👥' },
  { value: 'educativo', label: 'Educativo', emoji: '📚' },
  { value: 'outros', label: 'Outros', emoji: '🎯' },
]

const PRIORITIES: { value: LeisurePriority; label: string; color: string }[] = [
  { value: 'alta', label: 'Alta', color: 'text-red-500' },
  { value: 'media', label: 'Média', color: 'text-yellow-500' },
  { value: 'baixa', label: 'Baixa', color: 'text-green-500' },
]

export function LeisureActivitySheet({ open, onClose, item, onSave, members, onConvertToTask, onConvertToEvent }: Props) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<LeisureCategory>('outros')
  const [forChildren, setForChildren] = useState(false)
  const [forAdults, setForAdults] = useState(true)
  const [estimatedCost, setEstimatedCost] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const [priority, setPriority] = useState<LeisurePriority>('media')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [eventDate, setEventDate] = useState('')

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setEmoji(item.emoji ?? '🎉')
      setDescription(item.description ?? '')
      setCategory((item.category as LeisureCategory) ?? 'outros')
      setForChildren(item.for_children)
      setForAdults(item.for_adults)
      setEstimatedCost(item.estimated_cost?.toString() ?? '')
      setDurationHours(item.duration_hours?.toString() ?? '')
      setLocationName(item.location_name ?? '')
      setLocationUrl(item.location_url ?? '')
      setPriority(item.priority as LeisurePriority)
      setTags(item.tags.join(', '))
    } else {
      setTitle(''); setEmoji('🎉'); setDescription(''); setCategory('outros')
      setForChildren(false); setForAdults(true); setEstimatedCost('')
      setDurationHours(''); setLocationName(''); setLocationUrl('')
      setPriority('media'); setTags('')
    }
  }, [item, open])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      title: title.trim(),
      emoji,
      description: description || null,
      category,
      for_children: forChildren,
      for_adults: forAdults,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      duration_hours: durationHours ? parseFloat(durationHours) : null,
      location_name: locationName || null,
      location_url: locationUrl || null,
      priority,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    setSaving(false)
    onClose()
  }

  const handleConvertToEvent = async () => {
    if (!item || !eventDate || !onConvertToEvent) return
    await onConvertToEvent(item, eventDate)
    setShowDatePicker(false)
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
          <h2 className="text-lg font-semibold">{item ? 'Editar Atividade' : 'Nova Atividade de Lazer'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">×</button>
        </div>

        {/* Emoji + Título */}
        <div className="flex gap-2">
          <input
            className="border rounded-lg p-2 w-16 text-2xl text-center"
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            maxLength={2}
          />
          <input
            className="border rounded-lg p-2 flex-1"
            placeholder="Nome da atividade"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
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

        {/* Para quem */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={forAdults} onChange={e => setForAdults(e.target.checked)} />
            👨‍👩 Adultos
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={forChildren} onChange={e => setForChildren(e.target.checked)} />
            👶 Crianças
          </label>
        </div>

        {/* Prioridade */}
        <div className="flex gap-2">
          {PRIORITIES.map(p => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                priority === p.value ? 'bg-zinc-800 text-white border-zinc-800' : 'border-zinc-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Descrição */}
        <textarea
          className="border rounded-lg p-2 w-full text-sm"
          rows={2}
          placeholder="Descrição (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {/* Custo / Duração */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 mb-1 block">Custo estimado (R$)</label>
            <input
              type="number"
              className="border rounded-lg p-2 w-full text-sm"
              placeholder="0,00"
              value={estimatedCost}
              onChange={e => setEstimatedCost(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 mb-1 block">Duração (horas)</label>
            <input
              type="number"
              className="border rounded-lg p-2 w-full text-sm"
              placeholder="2"
              value={durationHours}
              onChange={e => setDurationHours(e.target.value)}
            />
          </div>
        </div>

        {/* Local */}
        <input
          className="border rounded-lg p-2 w-full text-sm"
          placeholder="📍 Nome do local"
          value={locationName}
          onChange={e => setLocationName(e.target.value)}
        />
        <input
          className="border rounded-lg p-2 w-full text-sm"
          placeholder="🔗 Link do local (Google Maps, site...)"
          value={locationUrl}
          onChange={e => setLocationUrl(e.target.value)}
        />

        {/* Tags */}
        <input
          className="border rounded-lg p-2 w-full text-sm"
          placeholder="Tags: família, fim de semana, grátis..."
          value={tags}
          onChange={e => setTags(e.target.value)}
        />

        {/* Botões de conversão (apenas edição de item existente) */}
        {item && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Converter em</p>
            <div className="flex gap-2">
              {!item.task_id && onConvertToTask && (
                <button
                  onClick={async () => { await onConvertToTask(item); onClose() }}
                  className="flex-1 py-2 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition"
                >
                  ⚡ Virar Tarefa
                </button>
              )}
              {item.task_id && (
                <span className="flex-1 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium text-center">
                  ✅ Tarefa criada
                </span>
              )}
              {!item.event_id && onConvertToEvent && (
                <button
                  onClick={() => setShowDatePicker(true)}
                  className="flex-1 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium hover:bg-purple-100 transition"
                >
                  📅 Agendar
                </button>
              )}
              {item.event_id && (
                <span className="flex-1 py-2 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium text-center">
                  📅 Agendado
                </span>
              )}
            </div>
            {showDatePicker && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  className="border rounded-lg p-2 flex-1 text-sm"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                />
                <button
                  onClick={handleConvertToEvent}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
