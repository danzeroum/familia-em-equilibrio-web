'use client'
import { useState, useEffect } from 'react'
import type { LeisureActivity, LeisureCategory, LeisurePriority } from '@/types/database'

const CATEGORIES: { value: LeisureCategory; label: string; emoji: string }[] = [
  { value: 'passeio',        label: 'Passeio',        emoji: '🚶' },
  { value: 'viagem',         label: 'Viagem',         emoji: '✈️' },
  { value: 'esporte',        label: 'Esporte',        emoji: '⚽' },
  { value: 'cultura',        label: 'Cultura',        emoji: '🎭' },
  { value: 'entretenimento', label: 'Entretenimento', emoji: '🎬' },
  { value: 'natureza',       label: 'Natureza',       emoji: '🌲' },
  { value: 'social',         label: 'Social',         emoji: '🤝' },
  { value: 'educativo',      label: 'Educativo',      emoji: '📚' },
  { value: 'outros',         label: 'Outros',         emoji: '🎉' },
]

interface Member {
  id: string
  name: string
  nickname?: string | null
  emoji?: string
  is_child?: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureActivity | null
  onSave: (payload: Partial<LeisureActivity>) => Promise<void>
  members: Member[]
  onConvertToTask?: (activity: LeisureActivity) => Promise<void>
  onConvertToEvent?: (activity: LeisureActivity, date: string) => Promise<void>
}

export function LeisureActivitySheet({
  open, onClose, item, onSave, members, onConvertToTask, onConvertToEvent
}: Props) {
  const [form, setForm] = useState<Partial<LeisureActivity>>({})
  const [saving, setSaving] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [showEventPicker, setShowEventPicker] = useState(false)

  useEffect(() => {
    if (item) {
      setForm(item)
    } else {
      setForm({
        status: 'wishlist',
        priority: 'media',
        for_adults: true,
        for_children: false,
        category: 'outros',
        tags: [],
      })
    }
    setShowEventPicker(false)
    setEventDate('')
  }, [item, open])

  const set = (key: keyof LeisureActivity, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    if (!form.title?.trim()) return
    setSaving(true)
    await onSave(form)
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {item ? 'Editar Atividade' : 'Nova Atividade de Lazer'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Emoji + Título */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="🎉"
              maxLength={2}
              value={form.emoji ?? ''}
              onChange={(e) => set('emoji', e.target.value)}
              className="w-14 text-center border rounded-lg p-2 text-xl"
            />
            <input
              type="text"
              placeholder="Nome da atividade *"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
              className="flex-1 border rounded-lg p-2"
            />
          </div>

          {/* Descrição */}
          <textarea
            placeholder="Descrição (opcional)"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            className="w-full border rounded-lg p-2 resize-none"
          />

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => set('category', c.value)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.category === c.value
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-300 hover:border-teal-400'
                  }`}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Público */}
          <div>
            <label className="block text-sm font-medium mb-1">Para quem?</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.for_adults ?? true}
                  onChange={(e) => set('for_adults', e.target.checked)}
                />
                <span>Adultos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.for_children ?? false}
                  onChange={(e) => set('for_children', e.target.checked)}
                />
                <span>Crianças</span>
              </label>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium mb-1">Prioridade</label>
            <div className="flex gap-2">
              {(['baixa', 'media', 'alta'] as LeisurePriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => set('priority', p)}
                  className={`flex-1 py-1 rounded-lg text-sm border transition-colors ${
                    form.priority === p
                      ? p === 'alta' ? 'bg-red-500 text-white border-red-500'
                        : p === 'media' ? 'bg-yellow-400 text-white border-yellow-400'
                        : 'bg-green-500 text-white border-green-500'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {p === 'alta' ? '🔴' : p === 'media' ? '🟡' : '🟢'} {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Custo e duração */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Custo estimado (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.estimated_cost ?? ''}
                onChange={(e) => set('estimated_cost', e.target.value ? Number(e.target.value) : null)}
                className="w-full border rounded-lg p-2"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Duração (horas)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="ex: 2.5"
                value={form.duration_hours ?? ''}
                onChange={(e) => set('duration_hours', e.target.value ? Number(e.target.value) : null)}
                className="w-full border rounded-lg p-2"
              />
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium mb-1">Local</label>
            <input
              type="text"
              placeholder="Nome do local"
              value={form.location_name ?? ''}
              onChange={(e) => set('location_name', e.target.value)}
              className="w-full border rounded-lg p-2 mb-2"
            />
            <input
              type="url"
              placeholder="Link (Maps, site...)"
              value={form.location_url ?? ''}
              onChange={(e) => set('location_url', e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Ações de conversão - só em modo edição */}
          {item && (onConvertToTask || onConvertToEvent) && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Converter em</p>
              <div className="flex gap-2 flex-wrap">
                {onConvertToTask && !item.task_id && (
                  <button
                    onClick={handleConvertToTask}
                    disabled={saving}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                  >
                    ⚡ Virar Tarefa
                  </button>
                )}
                {item.task_id && (
                  <span className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm">
                    ✅ Tarefa criada
                  </span>
                )}
                {onConvertToEvent && !item.event_id && !showEventPicker && (
                  <button
                    onClick={() => setShowEventPicker(true)}
                    className="flex items-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-sm hover:bg-purple-100 transition-colors"
                  >
                    📅 Agendar
                  </button>
                )}
                {item.event_id && (
                  <span className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm">
                    📅 Agendado
                  </span>
                )}
              </div>
              {showEventPicker && (
                <div className="mt-3 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Data do evento</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full border rounded-lg p-2"
                    />
                  </div>
                  <button
                    onClick={handleConvertToEvent}
                    disabled={!eventDate || saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-40 hover:bg-purple-700 transition-colors"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => setShowEventPicker(false)}
                    className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title?.trim()}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
