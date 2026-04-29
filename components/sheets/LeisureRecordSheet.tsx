'use client'

import { useState, useEffect } from 'react'
import { SlideOver, Field, SaveCancel } from './_shared'
import type { LeisureRecord, LeisureActivity } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureRecord | null
  defaults?: Partial<LeisureRecord>
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: { id: string; name: string; nickname?: string | null; is_child?: boolean }[]
  activities?: LeisureActivity[]
}

export function LeisureRecordSheet({ open, onClose, item, defaults, onSave, members, activities = [] }: Props) {
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
    const src = item ?? defaults ?? {}
    setTitle((src as any).title ?? '')
    setEmoji((src as any).emoji ?? '📸')
    setDescription((src as any).description ?? '')
    setDateRealized((src as any).date_realized ?? new Date().toISOString().split('T')[0])
    setRating((src as any).rating ?? 5)
    setParticipants((src as any).participants ?? [])
    setCostActual((src as any).cost_actual?.toString() ?? '')
    setLocationName((src as any).location_name ?? '')
    setNotes((src as any).notes ?? '')
    setWouldRepeat((src as any).would_repeat ?? true)
    setActivityId((src as any).activity_id ?? null)
  }, [item, defaults, open])

  if (!open) return null

  const toggleParticipant = (id: string) =>
    setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      ...(item ? { id: item.id } : {}),
      title: title.trim(),
      emoji,
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

  return (
    <SlideOver title={item ? 'Editar Registro' : 'Registrar Lazer'} onClose={onClose}>
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
          <Field label="Título" value={title} onChange={setTitle} placeholder="ex: Passeio na praia" />
        </div>
      </div>

      <Field label="Data" value={dateRealized} onChange={setDateRealized} type="date" />

      {activities.length > 0 && (
        <div>
          <label className="text-sm text-gray-600 block mb-1">Atividade vinculada (opcional)</label>
          <select
            value={activityId ?? ''}
            onChange={e => setActivityId(e.target.value || null)}
            className="input-base"
          >
            <option value="">— Nenhuma —</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>
                {a.emoji ?? '🎉'} {a.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-600 block mb-1">Avaliação</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`text-2xl transition-transform hover:scale-110 ${n <= rating ? 'opacity-100' : 'opacity-30'}`}
            >
              ⭐
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500 self-center">{rating}/5</span>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Participantes</label>
        <div className="flex flex-wrap gap-2">
          {members.map(m => (
            <button
              key={m.id}
              onClick={() => toggleParticipant(m.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                participants.includes(m.id)
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-teal-400'
              }`}
            >
              {m.is_child ? '🧒' : '🧑'} {m.nickname ?? m.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Descrição</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Como foi?"
          rows={2}
          className="input-base resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Custo real (R$)" value={costActual} onChange={setCostActual} type="number" placeholder="0.00" />
        <Field label="Local" value={locationName} onChange={setLocationName} placeholder="ex: Praia" />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Notas</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Dicas, observações..."
          rows={2}
          className="input-base resize-none"
        />
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          onClick={() => setWouldRepeat(!wouldRepeat)}
          className={`w-10 h-6 rounded-full transition-colors relative ${
            wouldRepeat ? 'bg-teal-500' : 'bg-gray-200'
          }`}
        >
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            wouldRepeat ? 'translate-x-4' : 'translate-x-0.5'
          }`} />
        </div>
        <span className="text-sm text-gray-700">🔄 Repetiria essa atividade</span>
      </label>

      <SaveCancel onSave={handleSave} onClose={onClose} saving={saving} />
    </SlideOver>
  )
}
