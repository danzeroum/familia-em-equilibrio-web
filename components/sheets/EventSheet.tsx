'use client'
import { useEffect, useState } from 'react'
import type { FamilyEvent } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  event: Partial<FamilyEvent> | null
  onSave: (e: any) => Promise<void>
  familyId: string
}

export function EventSheet({ open, onClose, event, onSave, familyId }: Props) {
  const [form, setForm] = useState<Partial<FamilyEvent>>({})

  useEffect(() => {
    setForm(event ?? { family_id: familyId, event_type: 'general' })
  }, [event, familyId, open])

  const set = (k: keyof FamilyEvent, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    if (!form.event_date) { alert('Data é obrigatória'); return }
    await onSave({ ...form, family_id: familyId })
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={event?.id ? 'Editar evento' : 'Novo evento'} onClose={onClose}>
      <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} placeholder="Ex: Consulta pediatra, Aniversário da Vovó..." />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data *" type="date" value={form.event_date ?? ''} onChange={v => set('event_date', v)} />
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
      </div>

      <Field label="Ação necessária" value={form.action_description ?? ''} onChange={v => set('action_description', v)} placeholder="Ex: Levar cartão do plano, comprar presente..." />
      <Field label="Orçamento estimado (R$)" type="number" value={String(form.budget_estimate ?? '')} onChange={v => set('budget_estimate', parseFloat(v))} placeholder="0,00" />
      <Field label="Observações" value={form.notes ?? ''} onChange={v => set('notes', v)} placeholder="Anotações adicionais..." />

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
