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
  { value: 'passeio',        label: 'Passeio',        emoji: '🏞️' },
  { value: 'viagem',         label: 'Viagem',         emoji: '✈️' },
  { value: 'esporte',        label: 'Esporte',        emoji: '⚽' },
  { value: 'cultura',        label: 'Cultura',        emoji: '🎨' },
  { value: 'entretenimento', label: 'Entretenimento', emoji: '🎬' },
  { value: 'natureza',       label: 'Natureza',       emoji: '🌳' },
  { value: 'social',         label: 'Social',         emoji: '👥' },
  { value: 'educativo',      label: 'Educativo',      emoji: '📚' },
  { value: 'outros',         label: 'Outros',         emoji: '🎉' },
]

const PRIORITIES: { value: LeisurePriority; label: string; color: string }[] = [
  { value: 'alta',  label: 'Alta',  color: 'text-red-500' },
  { value: 'media', label: 'Média', color: 'text-yellow-500' },
  { value: 'baixa', label: 'Baixa', color: 'text-green-500' },
]

export function LeisureActivitySheet({ open, onClose, item, onSave, members, onConvertToTask, onConvertToEvent }: Props) {
  const [form, setForm] = useState<Partial<LeisureActivity>>({})
  const [saving, setSaving] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [showEventPicker, setShowEventPicker] = useState(false)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (open) {
      setForm(item ?? {
        status: 'wishlist',
        priority: 'media',
        for_adults: true,
        for_children: false,
        category: 'outros',
        tags: [],
      })
      setEventDate('')
      setShowEventPicker(false)
    }
  }, [open, item])

  if (!open) return null

  const set = (key: keyof LeisureActivity, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

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

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    const tags = form.tags ?? []
    if (!tags.includes(t)) set('tags', [...tags, t])
    setTagInput('')
  }

  const removeTag = (tag: string) =>
    set('tags', (form.tags ?? []).filter(t => t !== tag))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {item ? 'Editar Atividade' : 'Nova Atividade de Lazer'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">×</button>
        </div>

        <div className="space-y-4">
          {/* Emoji + Título */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="🎉"
              value={form.emoji ?? ''}
              onChange={e => set('emoji', e.target.value)}
              className="w-14 text-center border rounded-lg px-2 py-2 text-xl"
              maxLength={4}
            />
            <input
              type="text"
              placeholder="Nome da atividade *"
              value={form.title ?? ''}
              onChange={e => set('title', e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => set('category', cat.value)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    form.category === cat.value
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-zinc-300 hover:border-teal-400'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Descrição */}
          <textarea
            placeholder="Descrição (opcional)"
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 resize-none"
          />

          {/* Para quem */}
          <div>
            <label className="block text-sm font-medium mb-1">Para quem?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.for_adults ?? true}
                  onChange={e => set('for_adults', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">👍 Adultos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.for_children ?? false}
                  onChange={e => set('for_children', e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">👶 Crianças</span>
              </label>
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-sm font-medium mb-1">Prioridade</label>
            <div className="flex gap-2">
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set('priority', p.value)}
                  className={`flex-1 py-1 rounded-lg text-sm border transition-colors ${
                    form.priority === p.value
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-zinc-300 hover:border-teal-400'
                  }`}
                >
                  <span className={form.priority === p.value ? '' : p.color}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custo estimado + Duração */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Custo estimado (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.estimated_cost ?? ''}
                onChange={e => set('estimated_cost', e.target.value ? Number(e.target.value) : null)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duração (horas)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="2"
                value={form.duration_hours ?? ''}
                onChange={e => set('duration_hours', e.target.value ? Number(e.target.value) : null)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Local */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nome do local</label>
              <input
                type="text"
                placeholder="Ex: Parque Ibirapuera"
                value={form.location_name ?? ''}
                onChange={e => set('location_name', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link (Maps/site)</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.location_url ?? ''}
                onChange={e => set('location_url', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Adicionar tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-zinc-100 rounded-lg text-sm hover:bg-zinc-200"
              >
                +
              </button>
            </div>
            {(form.tags ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(form.tags ?? []).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs flex items-center gap-1"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Converter (somente no modo edição) */}
          {item && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Converter em</p>
              <div className="flex gap-2">
                {onConvertToTask && !item.task_id && (
                  <button
                    type="button"
                    onClick={handleConvertTask}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                  >
                    ⚡ Virar Tarefa
                  </button>
                )}
                {item.task_id && (
                  <span className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-green-50 text-green-700 rounded-lg text-sm">
                    ✅ Tarefa criada
                  </span>
                )}
                {onConvertToEvent && !item.event_id && (
                  <button
                    type="button"
                    onClick={() => setShowEventPicker(p => !p)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors"
                  >
                    📅 Agendar
                  </button>
                )}
                {item.event_id && (
                  <span className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-purple-50 text-purple-700 rounded-lg text-sm">
                    📅 Agendado
                  </span>
                )}
              </div>
              {showEventPicker && (
                <div className="flex gap-2 mt-2">
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={handleConvertEvent}
                    disabled={!eventDate || saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    Confirmar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border rounded-lg text-sm hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.title?.trim()}
            className="flex-1 py-2 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : item ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
