'use client'
import { useState, useEffect } from 'react'
import type { LeisureRecord } from '@/types/database'

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
  item: LeisureRecord | null
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: Member[]
}

export function LeisureRecordSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<LeisureRecord>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setForm(item)
    } else {
      setForm({
        date_realized: new Date().toISOString().split('T')[0],
        would_repeat: true,
        participants: [],
        rating: null,
      })
    }
  }, [item, open])

  const set = (key: keyof LeisureRecord, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleParticipant = (memberId: string) => {
    const current = form.participants ?? []
    const updated = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId]
    set('participants', updated)
  }

  const handleSave = async () => {
    if (!form.title?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl flex flex-col h-full overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">
            {item ? 'Editar Registro' : 'Registrar Lazer'}
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
              placeholder="O que fizemos? *"
              value={form.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
              className="flex-1 border rounded-lg p-2"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              value={form.date_realized ?? ''}
              onChange={(e) => set('date_realized', e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Rating estrelas */}
          <div>
            <label className="block text-sm font-medium mb-1">Avaliação</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => set('rating', star === form.rating ? null : star)}
                  className="text-2xl transition-transform hover:scale-110"
                >
                  {(form.rating ?? 0) >= star ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>

          {/* Participantes */}
          {members.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">Quem participou?</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const selected = (form.participants ?? []).includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleParticipant(m.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-colors ${
                        selected
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-gray-300 hover:border-teal-400'
                      }`}
                    >
                      {m.emoji ?? (m.is_child ? '👶' : '👤')} {m.nickname ?? m.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custo real */}
          <div>
            <label className="block text-sm font-medium mb-1">Custo real (R$)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="0,00"
              value={form.cost_actual ?? ''}
              onChange={(e) => set('cost_actual', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium mb-1">Local</label>
            <input
              type="text"
              placeholder="Onde foi?"
              value={form.location_name ?? ''}
              onChange={(e) => set('location_name', e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          {/* Notas */}
          <textarea
            placeholder="Notas / memórias"
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            className="w-full border rounded-lg p-2 resize-none"
          />

          {/* Repetiria? */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('would_repeat', !form.would_repeat)}
              className={`w-11 h-6 rounded-full transition-colors ${
                form.would_repeat ? 'bg-teal-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow m-0.5 transition-transform ${
                  form.would_repeat ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm">🔄 Faria de novo</span>
          </label>
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
            {saving ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
