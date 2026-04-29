'use client'
import { useState, useEffect } from 'react'
import type { LeisureRecord, LeisureActivity, Profile } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureRecord | null
  activities: LeisureActivity[]
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: Profile[]
}

export function LeisureRecordSheet({ open, onClose, item, activities, onSave, members }: Props) {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('📸')
  const [description, setDescription] = useState('')
  const [dateRealized, setDateRealized] = useState(new Date().toISOString().split('T')[0])
  const [rating, setRating] = useState(5)
  const [participants, setParticipants] = useState<string[]>([])
  const [costActual, setCostActual] = useState('')
  const [locationName, setLocationName] = useState('')
  const [notes, setNotes] = useState('')
  const [wouldRepeat, setWouldRepeat] = useState(true)
  const [activityId, setActivityId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setTitle(item.title); setEmoji(item.emoji ?? '📸')
      setDescription(item.description ?? ''); setDateRealized(item.date_realized)
      setRating(item.rating ?? 5); setParticipants(item.participants ?? [])
      setCostActual(item.cost_actual?.toString() ?? ''); setLocationName(item.location_name ?? '')
      setNotes(item.notes ?? ''); setWouldRepeat(item.would_repeat); setActivityId(item.activity_id)
    } else {
      setTitle(''); setEmoji('📸'); setDescription('')
      setDateRealized(new Date().toISOString().split('T')[0])
      setRating(5); setParticipants([]); setCostActual('')
      setLocationName(''); setNotes(''); setWouldRepeat(true); setActivityId(null)
    }
  }, [item, open])

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
      title: title.trim(), emoji,
      description: description || null,
      date_realized: dateRealized,
      rating,
      participants,
      cost_actual: costActual ? parseFloat(costActual) : null,
      location_name: locationName || null,
      notes: notes || null,
      would_repeat: wouldRepeat,
      activity_id: activityId,
    })
    setSaving(false)
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
          <h2 className="text-lg font-semibold">{item ? 'Editar Registro' : 'Registrar Lazer'}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xl">×</button>
        </div>

        <div className="flex gap-2">
          <input
            className="border rounded-lg p-2 w-16 text-2xl text-center"
            value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2}
          />
          <input
            className="border rounded-lg p-2 flex-1"
            placeholder="Título do registro"
            value={title} onChange={e => setTitle(e.target.value)}
          />
        </div>

        <input
          type="date"
          className="border rounded-lg p-2 w-full text-sm"
          value={dateRealized}
          onChange={e => setDateRealized(e.target.value)}
        />

        {/* Avaliação */}
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Avaliação</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} className="text-2xl">
                {star <= rating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        {/* Participantes */}
        {members.length > 0 && (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Participantes</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleParticipant(m.id)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    participants.includes(m.id)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-zinc-200'
                  }`}
                >
                  {m.nickname ?? m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          className="border rounded-lg p-2 w-full text-sm"
          rows={2}
          placeholder="Como foi? (opcional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-zinc-500 mb-1 block">Custo real (R$)</label>
            <input
              type="number"
              className="border rounded-lg p-2 w-full text-sm"
              placeholder="0,00"
              value={costActual}
              onChange={e => setCostActual(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-zinc-500 mb-1 block">Local</label>
            <input
              className="border rounded-lg p-2 w-full text-sm"
              placeholder="Onde foi?"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
            />
          </div>
        </div>

        <textarea
          className="border rounded-lg p-2 w-full text-sm"
          rows={2}
          placeholder="Observações"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={wouldRepeat}
            onChange={e => setWouldRepeat(e.target.checked)}
          />
          🔄 Faria de novo!
        </label>

        {/* Vincular atividade */}
        {activities.length > 0 && (
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Vincular à atividade (opcional)</label>
            <select
              className="border rounded-lg p-2 w-full text-sm"
              value={activityId ?? ''}
              onChange={e => setActivityId(e.target.value || null)}
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

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-zinc-200 text-sm hover:bg-zinc-50">
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
