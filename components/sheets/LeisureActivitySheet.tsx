'use client'
import { useState, useEffect } from 'react'
import type { LeisureActivity, LeisureCategory, LeisurePriority } from '@/types/database'

interface Member {
  id: string
  name: string
  nickname?: string | null
  emoji?: string
  is_child?: boolean
  role?: string
}

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureActivity | null
  onSave: (payload: Partial<LeisureActivity>) => Promise<void>
  onConvertToTask?: (activity: LeisureActivity) => Promise<void>
  onConvertToEvent?: (activity: LeisureActivity, date: string) => Promise<void>
  members: Member[]
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
  { value: 'baixa', label: 'Baixa', color: 'text-green-600' },
  { value: 'media', label: 'Média', color: 'text-yellow-600' },
  { value: 'alta', label: 'Alta', color: 'text-red-600' },
]

export default function LeisureActivitySheet({
  open, onClose, item, onSave, onConvertToTask, onConvertToEvent, members
}: Props) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎉')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<LeisureCategory>('outros')
  const [priority, setPriority] = useState<LeisurePriority>('media')
  const [forChildren, setForChildren] = useState(true)
  const [forAdults, setForAdults] = useState(true)
  const [estimatedCost, setEstimatedCost] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationUrl, setLocationUrl] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [showEventDate, setShowEventDate] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [converting, setConverting] = useState<'task' | 'event' | null>(null)

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setEmoji(item.emoji || '🎉')
      setDescription(item.description || '')
      setCategory(item.category || 'outros')
      setPriority(item.priority || 'media')
      setForChildren(item.for_children)
      setForAdults(item.for_adults)
      setEstimatedCost(item.estimated_cost?.toString() || '')
      setDurationHours(item.duration_hours?.toString() || '')
      setLocationName(item.location_name || '')
      setLocationUrl(item.location_url || '')
      setTags((item.tags || []).join(', '))
    } else {
      setTitle(''); setEmoji('🎉'); setDescription('')
      setCategory('outros'); setPriority('media')
      setForChildren(true); setForAdults(true)
      setEstimatedCost(''); setDurationHours('')
      setLocationName(''); setLocationUrl(''); setTags('')
    }
    setShowEventDate(false)
    setConverting(null)
  }, [item, open])

  if (!open) return null

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      title: title.trim(),
      emoji,
      description: description || null,
      category,
      priority,
      for_children: forChildren,
      for_adults: forAdults,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      duration_hours: durationHours ? parseFloat(durationHours) : null,
      location_name: locationName || null,
      location_url: locationUrl || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
    setSaving(false)
    onClose()
  }

  const handleConvertToTask = async () => {
    if (!item || !onConvertToTask) return
    setConverting('task')
    await onConvertToTask(item)
    setConverting(null)
    onClose()
  }

  const handleConvertToEvent = async () => {
    if (!item || !onConvertToEvent || !eventDate) return
    setConverting('event')
    await onConvertToEvent(item, eventDate)
    setConverting(null)
    setShowEventDate(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {item ? 'Editar Atividade' : 'Nova Atividade de Lazer'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 p-1">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Emoji + Título */}
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
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nome da atividade"
              className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
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

          {/* Prioridade */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Prioridade</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    priority === p.value
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Para quem */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2">Para quem</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={forAdults} onChange={e => setForAdults(e.target.checked)} className="rounded" />
                👨 Adultos
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={forChildren} onChange={e => setForChildren(e.target.checked)} className="rounded" />
                👧 Crianças
              </label>
            </div>
          </div>

          {/* Descrição */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100 resize-none"
          />

          {/* Custo + Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Custo estimado (R$)</label>
              <input
                type="number"
                value={estimatedCost}
                onChange={e => setEstimatedCost(e.target.value)}
                placeholder="0,00"
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Duração (horas)</label>
              <input
                type="number"
                value={durationHours}
                onChange={e => setDurationHours(e.target.value)}
                placeholder="2"
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Localização */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Local</label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="Nome do local"
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Link (maps/site)</label>
              <input
                type="url"
                value={locationUrl}
                onChange={e => setLocationUrl(e.target.value)}
                placeholder="https://"
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Tags (separadas por vírgula)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="fim de semana, barato, ao ar livre"
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Botões de Conversão (só para itens existentes) */}
          {item && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Converter em</p>
              <div className="grid grid-cols-2 gap-2">
                {!item.task_id ? (
                  <button
                    onClick={handleConvertToTask}
                    disabled={converting === 'task'}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border border-teal-200 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950 transition-colors"
                  >
                    {converting === 'task' ? '...' : '⚡ Tarefa'}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
                    ✅ Tarefa criada
                  </div>
                )}
                {!item.event_id ? (
                  <button
                    onClick={() => setShowEventDate(!showEventDate)}
                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium border border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950 transition-colors"
                  >
                    📅 Evento
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg text-sm bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    📅 Agendado
                  </div>
                )}
              </div>
              {showEventDate && !item.event_id && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    onClick={handleConvertToEvent}
                    disabled={!eventDate || converting === 'event'}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
                  >
                    {converting === 'event' ? '...' : 'Confirmar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="flex-1 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
