'use client'
import { useState, useEffect } from 'react'
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
  { value: 'outros',         label: 'Outros',         emoji: '🎯' },
]

type Member = { id: string; name: string; emoji?: string | null; nickname?: string | null }

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
  const [form, setForm] = useState<Partial<LeisureActivity>>({})
  const [saving, setSaving] = useState(false)
  const [eventDate, setEventDate] = useState('')
  const [showEventPicker, setShowEventPicker] = useState(false)

  useEffect(() => {
    setForm(item ?? { status: 'wishlist', priority: 'media', for_adults: true, for_children: false, category: 'outros' })
    setShowEventPicker(false)
    setEventDate('')
  }, [item, open])

  if (!open) return null

  const set = (k: keyof LeisureActivity, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title?.trim()) return
    setSaving(true)
    await onSave(form)
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">{item ? 'Editar Atividade' : 'Nova Atividade de Lazer'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">✕</button>
        </div>

        {/* Emoji + Título */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="🎉"
            value={form.emoji ?? ''}
            onChange={e => set('emoji', e.target.value)}
            className="w-14 border rounded-lg px-2 py-2 text-center text-xl"
            maxLength={4}
          />
          <input
            type="text"
            placeholder="Nome da atividade *"
            value={form.title ?? ''}
            onChange={e => set('title', e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => set('category', c.value)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  form.category === c.value
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {c.emoji} {c.label}
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
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
        />

        {/* Para quem */}
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">Para quem</label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.for_adults} onChange={e => set('for_adults', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              👨 Adultos
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!form.for_children} onChange={e => set('for_children', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
              👧 Crianças
            </label>
          </div>
        </div>

        {/* Prioridade */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Prioridade</label>
          <div className="flex gap-2">
            {(['baixa', 'media', 'alta'] as LeisurePriority[]).map(p => (
              <button
                key={p}
                onClick={() => set('priority', p)}
                className={`text-xs px-3 py-1 rounded-full border transition-all ${
                  form.priority === p
                    ? p === 'alta' ? 'bg-red-500 text-white border-red-500'
                      : p === 'media' ? 'bg-amber-400 text-white border-amber-400'
                      : 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {p === 'alta' ? '🔴' : p === 'media' ? '🟡' : '🟢'} {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Custo estimado + duração */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Custo estimado (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.estimated_cost ?? ''}
              onChange={e => set('estimated_cost', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Duração (horas)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="ex: 2.5"
              value={form.duration_hours ?? ''}
              onChange={e => set('duration_hours', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Local */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Local</label>
            <input
              type="text"
              placeholder="Nome do local"
              value={form.location_name ?? ''}
              onChange={e => set('location_name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Link (Maps/site)</label>
            <input
              type="url"
              placeholder="https://"
              value={form.location_url ?? ''}
              onChange={e => set('location_url', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Botões de conversão (apenas em edição) */}
        {item && (
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs text-zinc-500 font-medium">Converter atividade em:</p>
            <div className="flex gap-2">
              {!item.task_id && onConvertToTask && (
                <button
                  onClick={async () => { setSaving(true); await onConvertToTask(item); setSaving(false); onClose() }}
                  disabled={saving}
                  className="flex-1 text-sm py-2 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                >
                  ⚡ Criar Tarefa
                </button>
              )}
              {item.task_id && (
                <span className="flex-1 text-sm py-2 text-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 border border-emerald-200">
                  ✅ Tarefa criada
                </span>
              )}
              {!item.event_id && onConvertToEvent && (
                <button
                  onClick={() => setShowEventPicker(v => !v)}
                  className="flex-1 text-sm py-2 rounded-lg border border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                >
                  📅 Agendar
                </button>
              )}
              {item.event_id && (
                <span className="flex-1 text-sm py-2 text-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200">
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
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={handleConvertToEvent}
                  disabled={!eventDate || saving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border text-sm font-medium text-zinc-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title?.trim()}
            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
