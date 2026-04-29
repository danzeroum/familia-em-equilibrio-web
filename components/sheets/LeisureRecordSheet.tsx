'use client'
import { useState, useEffect } from 'react'
import type { LeisureRecord, LeisureActivity, Profile } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureRecord | null
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: Profile[]
  activities?: LeisureActivity[]
}

export function LeisureRecordSheet({ open, onClose, item, onSave, members, activities = [] }: Props) {
  const [form, setForm] = useState<Partial<LeisureRecord>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(item ?? {
        date_realized: new Date().toISOString().split('T')[0],
        participants: [],
        would_repeat: true,
        rating: null,
      })
    }
  }, [open, item])

  if (!open) return null

  const set = (key: keyof LeisureRecord, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const toggleParticipant = (id: string) => {
    const current = form.participants ?? []
    set(
      'participants',
      current.includes(id) ? current.filter(p => p !== id) : [...current, id]
    )
  }

  const handleSave = async () => {
    if (!form.title?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {item ? 'Editar Registro' : 'Registrar Lazer Realizado'}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 text-xl">×</button>
        </div>

        <div className="space-y-4">
          {/* Emoji + Título */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="📸"
              value={form.emoji ?? ''}
              onChange={e => set('emoji', e.target.value)}
              className="w-14 text-center border rounded-lg px-2 py-2 text-xl"
              maxLength={4}
            />
            <input
              type="text"
              placeholder="O que fizemos? *"
              value={form.title ?? ''}
              onChange={e => set('title', e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2"
            />
          </div>

          {/* Vincular atividade */}
          {activities.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Atividade relacionada</label>
              <select
                value={form.activity_id ?? ''}
                onChange={e => set('activity_id', e.target.value || null)}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Nenhuma</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Data */}
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={form.date_realized ?? ''}
              onChange={e => set('date_realized', e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* Avaliação (estrelas) */}
          <div>
            <label className="block text-sm font-medium mb-1">Avaliação</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => set('rating', form.rating === star ? null : star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    (form.rating ?? 0) >= star ? 'text-yellow-400' : 'text-zinc-200'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Participantes */}
          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Quem participou?</label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const selected = (form.participants ?? []).includes(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleParticipant(m.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-colors ${
                        selected
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-zinc-300 hover:border-teal-400'
                      }`}
                    >
                      {m.nickname ?? m.name.split(' ')[0]}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custo real + Local */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Custo real (R$)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                placeholder="0,00"
                value={form.cost_actual ?? ''}
                onChange={e => set('cost_actual', e.target.value ? Number(e.target.value) : null)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Local</label>
              <input
                type="text"
                placeholder="Onde foi?"
                value={form.location_name ?? ''}
                onChange={e => set('location_name', e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Descrição */}
          <textarea
            placeholder="Como foi? Descrição / memória..."
            value={form.description ?? ''}
            onChange={e => set('description', e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 resize-none"
          />

          {/* Notas */}
          <textarea
            placeholder="Notas extras..."
            value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 resize-none"
          />

          {/* Repetiria? */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('would_repeat', !form.would_repeat)}
              className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                form.would_repeat ? 'bg-teal-500' : 'bg-zinc-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.would_repeat ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="text-sm">🔄 Repetiria essa atividade</span>
          </label>
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
            {saving ? 'Salvando...' : item ? 'Salvar' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
