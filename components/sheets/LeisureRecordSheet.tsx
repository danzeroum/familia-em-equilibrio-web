'use client'
import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { LeisureRecord, LeisureActivity } from '@/types/database'

interface Member { id: string; nickname?: string | null; name: string; emoji?: string | null; is_child?: boolean }

interface Props {
  open: boolean
  onClose: () => void
  item: LeisureRecord | null
  activities: LeisureActivity[]
  onSave: (payload: Partial<LeisureRecord>) => Promise<void>
  members: Member[]
}

export function LeisureRecordSheet({ open, onClose, item, activities, onSave, members }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateRealized, setDateRealized] = useState(new Date().toISOString().split('T')[0])
  const [emoji, setEmoji] = useState('📸')
  const [rating, setRating] = useState(0)
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
      setDescription(item.description ?? '')
      setDateRealized(item.date_realized)
      setEmoji(item.emoji ?? '📸')
      setRating(item.rating ?? 0)
      setParticipants(item.participants ?? [])
      setCostActual(item.cost_actual?.toString() ?? '')
      setLocationName(item.location_name ?? '')
      setNotes(item.notes ?? '')
      setWouldRepeat(item.would_repeat)
      setActivityId(item.activity_id ?? '')
    } else {
      setTitle(''); setDescription(''); setDateRealized(new Date().toISOString().split('T')[0])
      setEmoji('📸'); setRating(0); setParticipants([]); setCostActual('')
      setLocationName(''); setNotes(''); setWouldRepeat(true); setActivityId('')
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
      id: item?.id,
      title: title.trim(),
      description: description.trim() || null,
      date_realized: dateRealized,
      emoji,
      rating: rating || null,
      participants,
      cost_actual: costActual ? parseFloat(costActual) : null,
      location_name: locationName.trim() || null,
      notes: notes.trim() || null,
      would_repeat: wouldRepeat,
      activity_id: activityId || null,
    })
    setSaving(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item ? 'Editar Registro' : 'Registrar Lazer'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 mt-4">
          {/* Emoji + Título */}
          <div className="flex gap-2">
            <input
              type="text"
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              className="w-14 text-center text-2xl border rounded-lg p-2 bg-background"
              maxLength={4}
            />
            <input
              type="text"
              placeholder="O que fizeram?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 bg-background text-sm"
            />
          </div>

          {/* Data */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Data</label>
            <input
              type="date"
              value={dateRealized}
              onChange={e => setDateRealized(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
            />
          </div>

          {/* Avaliação */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Avaliação</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    star <= rating ? 'text-yellow-400' : 'text-muted-foreground/30'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Participantes */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Participantes</label>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleParticipant(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                    participants.includes(m.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-muted'
                  }`}
                >
                  <span>{m.emoji ?? (m.is_child ? '👶' : '👤')}</span>
                  <span>{m.nickname ?? m.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vinculado a atividade */}
          {activities.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Vinculado a (opcional)</label>
              <select
                value={activityId}
                onChange={e => setActivityId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              >
                <option value="">Nenhuma atividade</option>
                {activities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custo e local */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Custo real (R$)</label>
              <input
                type="number"
                value={costActual}
                onChange={e => setCostActual(e.target.value)}
                placeholder="0,00"
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Local</label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="Onde foi?"
                className="w-full border rounded-lg px-3 py-2 bg-background text-sm"
              />
            </div>
          </div>

          {/* Descrição / Notas */}
          <textarea
            placeholder="Como foi? Anote memórias…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="border rounded-lg px-3 py-2 bg-background text-sm resize-none"
          />

          {/* Repetiria? */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setWouldRepeat(!wouldRepeat)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                wouldRepeat ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                wouldRepeat ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <span className="text-sm">🔄 Repetiria essa atividade</span>
          </label>

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!title.trim() || saving}
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? 'Salvando…' : item ? 'Salvar' : 'Registrar'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
