'use client'
import { useEffect, useState } from 'react'
import type { EmergencyContact } from '@/types/database'

interface Props { open: boolean; onClose: () => void; contact: EmergencyContact | null; onSave: (c: any) => Promise<void> }

export function EmergencyContactSheet({ open, onClose, contact, onSave }: Props) {
  const [form, setForm] = useState<Partial<EmergencyContact>>({})
  useEffect(() => { setForm(contact ?? { is_primary: false }) }, [contact])
  const set = (k: keyof EmergencyContact, v: any) => setForm(f => ({ ...f, [k]: v }))
  async function save() { await onSave(form); onClose() }
  if (!open) return null
  return (
    <SlideOver title={contact ? 'Editar contato' : 'Novo contato de emergência'} onClose={onClose}>
      <Field label="Nome *" value={form.name ?? ''} onChange={v => set('name', v)} />
      <Field label="Telefone *" value={form.phone ?? ''} onChange={v => set('phone', v)} />
      <Field label="Parentesco" value={form.relationship ?? ''} onChange={v => set('relationship', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!form.is_primary} onChange={e => set('is_primary', e.target.checked)} id="is-primary" />
        <label htmlFor="is-primary" className="text-sm text-gray-600">Contato principal</label>
      </div>
      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
