'use client'
import { useEffect, useState } from 'react'
import type { Vaccine, Profile } from '@/types/database'

interface Props { open: boolean; onClose: () => void; vaccine: Vaccine | null; onSave: (v: any) => Promise<void>; members: Profile[] }

export function VaccineSheet({ open, onClose, vaccine, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<Vaccine>>({})
  useEffect(() => { setForm(vaccine ?? {}) }, [vaccine])
  const set = (k: keyof Vaccine, v: any) => setForm(f => ({ ...f, [k]: v }))
  async function save() { await onSave(form); onClose() }
  if (!open) return null
  return (
    <SlideOver title={vaccine ? 'Editar vacina' : 'Nova vacina'} onClose={onClose}>
      <Field label="Nome da vacina *" value={form.name ?? ''} onChange={v => set('name', v)} />
      <div>
        <label className="text-sm text-gray-600">Membro</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value)}>
          <option value="">— Selecione —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>
      <Field label="Data de aplicação" type="date" value={form.applied_date ?? ''} onChange={v => set('applied_date', v)} />
      <Field label="Próxima dose" type="date" value={form.next_due ?? ''} onChange={v => set('next_due', v)} />
      <Field label="Lote" value={form.batch_number ?? ''} onChange={v => set('batch_number', v)} />
      <Field label="Local de aplicação" value={form.applied_at ?? ''} onChange={v => set('applied_at', v)} />
      <Field label="Observações" value={form.notes ?? ''} onChange={v => set('notes', v)} />
      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
