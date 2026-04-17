'use client'
import { useEffect, useState } from 'react'
import type { FamilyEvent, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  event: Partial<FamilyEvent> | null
  onSave: (e: any) => Promise<void>
  familyId: string
  members: Profile[]
}

export function EventSheet({ open, onClose, event, onSave, familyId, members }: Props) {
  const [form, setForm] = useState<Partial<FamilyEvent & Record<string, any>>>({})
  const [participants, setParticipants] = useState<string[]>([])

  useEffect(() => {
    const base = event ?? { family_id: familyId, event_type: 'general' }
    setForm(base)
    setParticipants((base as any).participants ?? [])
  }, [event, familyId, open])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  function toggleParticipant(id: string) {
    setParticipants(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    if (!form.event_date) { alert('Data é obrigatória'); return }
    await onSave({ ...form, family_id: familyId, participants })
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={event?.id ? 'Editar evento' : 'Novo evento'} onClose={onClose}>

      {/* Título */}
      <Field
        label="Título *"
        value={form.title ?? ''}
        onChange={v => set('title', v)}
        placeholder="Ex: Consulta pediatra, Aniversário da Vovó..."
      />

      {/* Descrição */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Descrição</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Detalhes sobre o evento..."
          value={form.description ?? ''}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {/* Data + Hora */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data *" type="date" value={form.event_date ?? ''} onChange={v => set('event_date', v)} />
        <div>
          <label className="text-sm text-gray-600 block mb-1">Hora</label>
          <input
            type="time"
            className="input-base"
            value={form.event_time ?? ''}
            onChange={e => set('event_time', e.target.value || null)}
          />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Tipo</label>
        <select className="input-base" value={form.event_type ?? 'general'} onChange={e => set('event_type', e.target.value)}>
          <option value="general">📅 Geral</option>
          <option value="birthday">🎂 Aniversário</option>
          <option value="school">🎒 Escola</option>
          <option value="medical">🏥 Médico</option>
          <option value="travel">✈️ Viagem</option>
        </select>
      </div>

      {/* Local */}
      <Field
        label="Local"
        value={form.location ?? ''}
        onChange={v => set('location', v)}
        placeholder="Ex: UBS Centro, Escola Estadual, Aeroporto..."
      />

      {/* Responsável */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select
          className="input-base"
          value={form.assigned_to ?? ''}
          onChange={e => set('assigned_to', e.target.value || null)}
        >
          <option value="">— Selecione —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nickname ?? (m as any).name}</option>
          ))}
        </select>
      </div>

      {/* Participantes */}
      {members.length > 0 && (
        <div>
          <label className="text-sm text-gray-600 block mb-2">Participantes</label>
          <div className="flex flex-wrap gap-2">
            {members.map(m => {
              const selected = participants.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleParticipant(m.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                    ${selected
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'}`}
                >
                  {m.nickname ?? (m as any).name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Ação necessária */}
      <Field
        label="Ação necessária"
        value={form.action_description ?? ''}
        onChange={v => set('action_description', v)}
        placeholder="Ex: Levar cartão do plano, comprar presente..."
      />

      {/* Orçamento */}
      <Field
        label="Orçamento estimado (R$)"
        type="number"
        value={String(form.budget_estimate ?? '')}
        onChange={v => set('budget_estimate', v ? parseFloat(v) : null)}
        placeholder="0,00"
      />

      {/* Observações */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Notas rápidas, lembretes..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
