'use client'
import { useEffect, useState } from 'react'
import type { FamilyEvent } from '@/types/database'

interface Props { open: boolean; onClose: () => void; event: Partial<FamilyEvent> | null; onSave: (e: any) => Promise<void>; familyId: string }

export function EventSheet({ open, onClose, event, onSave, familyId }: Props) {
  const [form, setForm] = useState<Partial<FamilyEvent>>({})
  useEffect(() => { setForm(event ?? { family_id: familyId, event_type: 'general' }) }, [event, familyId])
  const set = (k: keyof FamilyEvent, v: any) => setForm(f => ({ ...f, [k]: v }))
  async function save() { await onSave({ ...form, family_id: familyId }); onClose() }
  if (!open) return null
  return (
    <SlideOver title={event?.id ? 'Editar evento' : 'Novo evento'} onClose={onClose}>
      <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} />
      <Field label="Data *" type="date" value={form.event_date ?? ''} onChange={v => set('event_date', v)} />
      <div>
        <label className="text-sm text-gray-600">Tipo</label>
        <select className="input-base" value={form.event_type ?? 'general'} onChange={e => set('event_type', e.target.value)}>
          <option value="general">📅 Geral</option>
          <option value="birthday">🎂 Aniversário</option>
          <option value="school">🎒 Escola</option>
          <option value="medical">🏥 Médico</option>
          <option value="travel">✈️ Viagem</option>
        </select>
      </div>
      <Field label="Ação necessária" value={form.action_description ?? ''} onChange={v => set('action_description', v)} />
      <Field label="Orçamento estimado (R$)" type="number" value={String(form.budget_estimate ?? '')} onChange={v => set('budget_estimate', parseFloat(v))} />
      <Field label="Observações" value={form.notes ?? ''} onChange={v => set('notes', v)} />
      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
