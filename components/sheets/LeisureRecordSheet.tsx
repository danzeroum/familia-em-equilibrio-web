'use client'
import { useState, useEffect } from 'react'
import type { LeisureRecord, LeisureActivity } from '@/types/database'

type Member = { id: string; name: string; emoji?: string | null; nickname?: string | null; is_child?: boolean }

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureRecord | null
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: Member[]
  activities?: LeisureActivity[]
}

export function LeisureRecordSheet({ open, onClose, item, onSave, members, activities = [] }: Props) {
  const [form, setForm] = useState<Partial<LeisureRecord>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(item ?? {
      date_realized: new Date().toISOString().slice(0, 10),
      participants: [],
      would_repeat: true,
      rating: null,
    })
  }, [item, open])

  if (!open) return null

  const set = (k: keyof LeisureRecord, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleParticipant = (id: string) => {
    const current = (form.participants ?? []) as string[]
    set('participants', current.includes(id) ? current.filter(p => p !== id) : [...current, id])
  }

  const handleSave = async () => {
    if (!form.title?.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">{item ? 'Editar Registro' : 'Registrar Lazer'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">✕</button>
        </div>

        {/* Emoji + Título */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="📸"
            value={form.emoji ?? ''}
            onChange={e => set('emoji', e.target.value)}
            className="w-14 border rounded-lg px-2 py-2 text-center text-xl"
            maxLength={4}
          />
          <input
            type="text"
            placeholder="O que fizeram? *"
            value={form.title ?? ''}
            onChange={e => set('title', e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Data */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Data</label>
          <input
            type="date"
            value={form.date_realized ?? ''}
            onChange={e => set('date_realized', e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Vincular atividade */}
        {activities.length > 0 && (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Atividade da wishlist (opcional)</label>
            <select
              value={form.activity_id ?? ''}
              onChange={e => set('activity_id', e.target.value || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Nenhuma —</option>
              {activities.map(a => (
                <option key={a.id} value={a.id}>{a.emoji} {a.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Rating */}
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">Avaliação</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => set('rating', form.rating === n ? null : n)}
                className={`text-2xl transition-transform hover:scale-110 ${
                  (form.rating ?? 0) >= n ? 'opacity-100' : 'opacity-25'
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Participantes */}
        <div>
          <label className="text-xs text-zinc-500 mb-2 block">Quem participou?</label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => {
              const active = ((form.participants ?? []) as string[]).includes(m.id)
              return (
                <button
                  key={m.id}
                  onClick={() => toggleParticipant(m.id)}
                  className={`text-sm px-3 py-1 rounded-full border transition-all ${
                    active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {m.emoji ?? '👤'} {m.nickname ?? m.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custo + Local */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Custo real (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={form.cost_actual ?? ''}
              onChange={e => set('cost_actual', e.target.value ? Number(e.target.value) : null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Local</label>
            <input
              type="text"
              placeholder="Onde foi?"
              value={form.location_name ?? ''}
              onChange={e => set('location_name', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Notas */}
        <textarea
          placeholder="Anotações, memórias, o que rolou..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
        />

        {/* Repetiria? */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.would_repeat}
            onChange={e => set('would_repeat', e.target.checked)}
            className="w-4 h-4 accent-emerald-600"
          />
          <span className="text-sm">🔄 Repetiria essa atividade</span>
        </label>

        {/* Ações */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border text-sm font-medium text-zinc-600">Cancelar</button>
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
