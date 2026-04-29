'use client'

import { useState, useEffect } from 'react'
import { SlideOver, Field, SaveCancel } from './_shared'
import type { LeisureActivity } from '@/types/database'

const CATEGORIES = [
  { value: 'passeio', label: '🚶 Passeio' },
  { value: 'viagem', label: '✈️ Viagem' },
  { value: 'esporte', label: '⚽ Esporte' },
  { value: 'cultura', label: '🎭 Cultura' },
  { value: 'entretenimento', label: '🎮 Entretenimento' },
  { value: 'natureza', label: '🌿 Natureza' },
  { value: 'social', label: '👥 Social' },
  { value: 'educativo', label: '📚 Educativo' },
  { value: 'outros', label: '📦 Outros' },
]

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureActivity | null
  onSave: (payload: Partial<LeisureActivity>) => Promise<void>
  members: { id: string; name: string; nickname?: string | null; is_child?: boolean }[]
  onConvertToTask?: (activity: LeisureActivity) => Promise<void>
  onConvertToEvent?: (activity: LeisureActivity, date: string) => Promise<void>
}

export function LeisureActivitySheet({ open, onClose, item, onSave, members, onConvertToTask, onConvertToEvent }: Props) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<LeisureActivity['category']>('outros')
  const [forChildren, setForChildren] = useState(false)
  const [forAdults, setForAdults] = useState(true)
  const [estimatedCost, setEstimatedCost] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const [priority, setPriority] = useState<LeisureActivity['priority']>('media')
  const [tags, setTags] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setEmoji(item.emoji ?? '🎉')
      setDescription(item.description ?? '')
      setCategory(item.category ?? 'outros')
      setForChildren(item.for_children)
      setForAdults(item.for_adults)
      setEstimatedCost(item.estimated_cost?.toString() ?? '')
      setDurationHours(item.duration_hours?.toString() ?? '')
      setLocationName(item.location_name ?? '')
      setLocationUrl(item.location_url ?? '')
      setPriority(item.priority ?? 'media')
      setTags(item.tags?.join(', ') ?? '')
    } else {
      setTitle('')
      setEmoji('🎉')
      setDescription('')
      setCategory('outros')
      setForChildren(false)
      setForAdults(true)
      setEstimatedCost('')
      setDurationHours('')
      setLocationName('')
      setLocationUrl('')
      setPriority('media')
      setTags('')
    }
    setShowEventPicker(false)
    setEventDate('')
  }, [item, open])

  if (!open) return null

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      ...(item ? { id: item.id } : {}),
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
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
    setSaving(false)
    onClose()
  }

  const handleConvertToTask = async () => {
    if (!item || !onConvertToTask) return
    setSaving(true)
    await onConvertToTask(item)
    setSaving(false)
    onClose()
  }

  const handleConvertToEvent = async () => {
    if (!item || !onConvertToEvent || !eventDate) return
    setSaving(true)
    await onConvertToEvent(item, eventDate)
    setSaving(false)
    setShowEventPicker(false)
    onClose()
  }

  return (
    <SlideOver title={item ? 'Editar Atividade' : 'Nova Ideia de Lazer'} onClose={onClose}>
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
          <Field label="Título" value={title} onChange={setTitle} placeholder="ex: Praia de Bertioga" />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Categoria</label>
        <select
          value={category ?? 'outros'}
          onChange={e => setCategory(e.target.value as LeisureActivity['category'])}
          className="input-base"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Descrição</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Detalhes da atividade..."
          rows={2}
          className="input-base resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Custo estimado (R$)" value={estimatedCost} onChange={setEstimatedCost} type="number" placeholder="0.00" />
        <Field label="Duração (horas)" value={durationHours} onChange={setDurationHours} type="number" placeholder="ex: 3" />
      </div>

      <Field label="Local" value={locationName} onChange={setLocationName} placeholder="ex: Praia de Itaguaré" />
      <Field label="Link do local" value={locationUrl} onChange={setLocationUrl} placeholder="https://maps.google.com/..." />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Prioridade</label>
        <div className="flex gap-2">
          {(['baixa', 'media', 'alta'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors ${
                priority === p
                  ? p === 'alta' ? 'bg-red-500 text-white border-red-500'
                  : p === 'media' ? 'bg-yellow-400 text-white border-yellow-400'
                  : 'bg-green-500 text-white border-green-500'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              {p === 'baixa' ? '🟢 Baixa' : p === 'media' ? '🟡 Média' : '🔴 Alta'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={forAdults} onChange={e => setForAdults(e.target.checked)} className="rounded" />
          🧑 Adultos
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={forChildren} onChange={e => setForChildren(e.target.checked)} className="rounded" />
          🧒 Crianças
        </label>
      </div>

      <Field label="Tags (separadas por vírgula)" value={tags} onChange={setTags} placeholder="ex: praia, família, gratuito" />

      {item && (
        <div className="border-t pt-4 space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Conversões</p>
          {item.task_id ? (
            <div className="text-xs text-teal-600 bg-teal-50 rounded-lg px-3 py-2">✅ Tarefa já criada</div>
          ) : (
            <button
              onClick={handleConvertToTask}
              disabled={saving}
              className="w-full py-2 rounded-lg border border-teal-600 text-teal-600 text-sm hover:bg-teal-50 transition-colors"
            >
              ⚡ Transformar em Tarefa
            </button>
          )}
          {item.event_id ? (
            <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">📅 Evento já agendado</div>
          ) : showEventPicker ? (
            <div className="flex gap-2">
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="input-base flex-1"
              />
              <button
                onClick={handleConvertToEvent}
                disabled={!eventDate || saving}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowEventPicker(true)}
              className="w-full py-2 rounded-lg border border-blue-500 text-blue-600 text-sm hover:bg-blue-50 transition-colors"
            >
              📅 Agendar como Evento
            </button>
          )}
        </div>
      )}

      <SaveCancel onSave={handleSave} onClose={onClose} />
    </SlideOver>
  )
}
