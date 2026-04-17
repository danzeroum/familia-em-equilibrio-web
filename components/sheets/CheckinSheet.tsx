'use client'
import { useState } from 'react'
import type { Profile } from '@/types/database'
import { SlideOver, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (c: any) => Promise<void>
  members: Profile[]
}

export function CheckinSheet({ open, onClose, onSave, members }: Props) {
  const [profileId, setProfileId] = useState('')
  const [practice, setPractice] = useState('')
  const [mood, setMood] = useState(3)
  const [notes, setNotes] = useState('')

  async function save() {
    if (!profileId) { alert('Selecione um membro'); return }
    await onSave({
      profile_id: profileId,
      practice,
      mood_level: mood,
      notes,
      registered_by: profileId,
    })
    setProfileId('')
    setPractice('')
    setMood(3)
    setNotes('')
    onClose()
  }

  if (!open) return null

  const moodLabels = ['', '😢 Muito ruim', '😔 Ruim', '😐 Neutro', '🙂 Bem', '😄 Ótimo']

  return (
    <SlideOver title="Check-in emocional" onClose={onClose}>
      <div>
        <label className="text-sm text-gray-600 block mb-1">Membro *</label>
        <select
          className="input-base"
          value={profileId}
          onChange={e => setProfileId(e.target.value)}
        >
          <option value="">— Selecione —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Prática realizada</label>
        <input
          value={practice}
          onChange={e => setPractice(e.target.value)}
          className="input-base"
          placeholder="Ex: Meditação, exercício, leitura..."
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-2">
          Humor: <span className="font-medium">{moodLabels[mood]}</span>
        </label>
        <input
          type="range"
          min={1}
          max={5}
          value={mood}
          onChange={e => setMood(Number(e.target.value))}
          className="w-full accent-teal-600"
        />
        <div className="flex justify-between text-sm mt-1">
          <span>😢</span><span>😔</span><span>😐</span><span>🙂</span><span>😄</span>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observação</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="input-base resize-none"
          rows={3}
          placeholder="Como foi o dia?"
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
