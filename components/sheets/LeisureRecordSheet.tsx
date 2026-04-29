'use client'
import { useState, useEffect } from 'react'
import type { LeisureRecord, LeisureActivity } from '@/types/database'

interface Member {
  id: string
  name: string
  nickname?: string | null
  emoji?: string
  role?: string
}

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureRecord | null
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: Member[]
  activities?: LeisureActivity[]
  defaultActivityId?: string
}

export default function LeisureRecordSheet({
  open, onClose, item, onSave, members, activities = [], defaultActivityId
}: Props) {
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
  const [activityId, setActivityId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setEmoji(item.emoji || '📸')
      setDescription(item.description || '')
      setDateRealized(item.date_realized)
      setRating(item.rating || 5)
      setParticipants(item.participants || [])
      setCostActual(item.cost_actual?.toString() || '')
      setLocationName(item.location_name || '')
      setNotes(item.notes || '')
      setWouldRepeat(item.would_repeat)
      setActivityId(item.activity_id || '')
    } else {
      setTitle(''); setEmoji('📸'); setDescription('')
      setDateRealized(new Date().toISOString().split('T')[0])
      setRating(5); setParticipants([]); setCostActual('')
      setLocationName(''); setNotes(''); setWouldRepeat(true)
      setActivityId(defaultActivityId || '')
    }
  }, [item, open, defaultActivityId])

  if (!open) return null

  const toggleParticipant = (id: string) => {
    setParticipants(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      ...(item?.id ? { id: item.id } : {}),
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
      activity_id: activityId || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {item ? 'Editar Registro' : 'Registrar Lazer'}
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
              placeholder="O que fizeram?"
              className="flex-1 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Data</label>
            <input
              type="date"
              value={dateRealized}
              onChange={e => setDateRealized(e.target.value)}
              className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2">Avaliação</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    n <= rating ? 'opacity-100' : 'opacity-30'
                  }`}
                >
                  ⭐
                </button>
              ))}
              <span className="ml-2 text-sm text-zinc-500 self-center">{rating}/5</span>
            </div>
          </div>

          {/* Participantes */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-2">Quem participou</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => toggleParticipant(m.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
                    participants.includes(m.id)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {m.emoji || (m.role === 'child' ? '👧' : '👤')} {m.nickname || m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Atividade vinculada */}
          {activities.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Atividade planejada (opcional)</label>
              <select
                value={activityId}
                onChange={e => setActivityId(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">— Nenhuma —</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>{a.emoji} {a.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custo + Local */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Custo real (R$)</label>
              <input
                type="number"
                value={costActual}
                onChange={e => setCostActual(e.target.value)}
                placeholder="0,00"
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Local</label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="Onde foi?"
                className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Descrição */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Como foi? (opcional)"
            rows={2}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-zinc-800 dark:text-zinc-100 resize-none"
          />

          {/* Would repeat */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setWouldRepeat(!wouldRepeat)}
              className={`w-10 h-6 rounded-full transition-colors ${
                wouldRepeat ? 'bg-teal-600' : 'bg-zinc-300 dark:bg-zinc-600'
              } relative`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                wouldRepeat ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">🔄 Faria de novo</span>
          </label>
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
