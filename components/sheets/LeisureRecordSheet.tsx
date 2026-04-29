'use client'
import { useEffect, useState } from 'react'
import type { LeisureRecord, LeisureActivity } from '@/types/database'
import type { Profile } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureRecord | null
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: Profile[]
  activities?: LeisureActivity[]
}

export function LeisureRecordSheet({ open, onClose, item, onSave, members, activities = [] }: Props) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('📸')
  const [description, setDescription] = useState('')
  const [dateRealized, setDateRealized] = useState(new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState<number>(0)
  const [participants, setParticipants] = useState<string[]>([])
  const [costActual, setCostActual] = useState('')
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')
  const [wouldRepeat, setWouldRepeat] = useState(true)
  const [activityId, setActivityId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setEmoji(item.emoji ?? '📸')
      setDescription(item.description ?? '')
      setDateRealized(item.date_realized)
      setRating(item.rating ?? 0)
      setParticipants(item.participants ?? [])
      setCostActual(item.cost_actual?.toString() ?? '')
      setLocationName(item.location_name ?? '')
      setNotes(item.notes ?? '')
      setWouldRepeat(item.would_repeat)
      setActivityId(item.activity_id)
    } else {
      setTitle('')
      setEmoji('📸')
      setDescription('')
      setDateRealized(new Date().toISOString().split('T')[0])
      setRating(0)
      setParticipants([])
      setCostActual('')
      setLocationName('')
      setNotes('')
      setWouldRepeat(true)
      setActivityId(null)
    }
  }, [item, open])

  if (!open) return null

  const toggleParticipant = (id: string) => {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      ...(item?.id ? { id: item.id } : {}),
      title: title.trim(),
      emoji,
      description: description.trim() || null,
      date_realized: dateRealized,
      rating: rating || null,
      participants,
      cost_actual: costActual ? parseFloat(costActual) : null,
      location_name: locationName.trim() || null,
      notes: notes.trim() || null,
      would_repeat: wouldRepeat,
      activity_id: activityId,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item ? 'Editar Registro' : 'Registrar Lazer'}</h2>
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
            placeholder="O que fizeram?"
            className="flex-1 border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {/* Data */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Data</label>
          <input
            type="date"
            value={dateRealized}
            onChange={e => setDateRealized(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Avaliação</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n === rating ? 0 : n)}
                className={`text-2xl transition-transform hover:scale-110 ${
                  n <= rating ? 'opacity-100' : 'opacity-30'
                }`}
              >
                ⭐
              </button>
            ))}
          </div>
        </div>

        {/* Participantes */}
        {members.length > 0 && (
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Participantes</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleParticipant(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    participants.includes(m.id)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-zinc-200 text-zinc-600 hover:border-teal-400'
                  }`}
                >
                  {m.role === 'child' || m.role === 'teen' ? '👦' : '👤'} {m.nickname ?? m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custo real e local */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Custo real (R$)</label>
            <input
              type="number"
              value={costActual}
              onChange={e => setCostActual(e.target.value)}
              placeholder="0,00"
              className="w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Local</label>
            <input
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
              placeholder="Onde foi?"
              className="w-full border rounded-xl px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Notas */}
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Anotações, memórias..."
          rows={2}
          className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
        />

        {/* Repetiria? */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setWouldRepeat(!wouldRepeat)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${
              wouldRepeat ? 'bg-teal-500' : 'bg-zinc-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
              wouldRepeat ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </div>
          <span className="text-sm">🔄 Repetiria esta atividade</span>
        </label>

        {/* Vincular atividade */}
        {activities.length > 0 && (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Vincular a atividade (opcional)</label>
            <select
              value={activityId ?? ''}
              onChange={e => setActivityId(e.target.value || null)}
              className="w-full border rounded-xl px-3 py-2 text-sm"
            >
              <option value="">— Nenhuma —</option>
              {activities.map(a => (
                <option key={a.id} value={a.id}>{a.emoji} {a.title}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 border rounded-xl text-sm hover:bg-zinc-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
