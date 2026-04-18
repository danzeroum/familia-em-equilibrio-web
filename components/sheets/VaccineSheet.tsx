'use client'
import { useEffect, useState } from 'react'
import type { Vaccine, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  vaccine: Vaccine | null
  onSave: (v: any) => Promise<void>
  members: Profile[]
}

export function VaccineSheet({ open, onClose, vaccine, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<Vaccine>>({})

  useEffect(() => {
    setForm(vaccine ?? {})
  }, [vaccine, open])

  const set = (k: keyof Vaccine, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome da vacina é obrigatório'); return }
    if (!form.profile_id) { alert('Selecione um membro'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={vaccine ? 'Editar vacina' : 'Nova vacina'} onClose={onClose}>
      <Field label="Nome da vacina *" value={form.name ?? ''} onChange={v => set('name', v)} placeholder="Ex: Covid-19, Gripe, Tétano..." />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Membro *</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value)}>
          <option value="">— Selecione —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data de aplicação" type="date" value={form.applied_at ?? ''} onChange={v => set('applied_at', v)} />
        <Field label="Próxima dose" type="date" value={form.next_due ?? ''} onChange={v => set('next_due', v)} />
      </div>

      <Field label="Observações" value={form.notes ?? ''} onChange={v => set('notes', v)} placeholder="Reações, observações do médico..." />

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
