'use client'
import { useEffect, useState } from 'react'
import type { EmergencyContact } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  contact: EmergencyContact | null
  onSave: (c: any) => Promise<void>
}

export function EmergencyContactSheet({ open, onClose, contact, onSave }: Props) {
  const [form, setForm] = useState<Partial<EmergencyContact>>({})

  useEffect(() => {
    setForm(contact ?? { is_primary: false })
  }, [contact, open])

  const set = (k: keyof EmergencyContact, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome é obrigatório'); return }
    if (!form.phone?.trim()) { alert('Telefone é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={contact ? 'Editar contato' : 'Novo contato de emergência'} onClose={onClose}>
      <Field label="Nome *" value={form.name ?? ''} onChange={v => set('name', v)} placeholder="Ex: Avó Maria" />
      <Field label="Telefone *" value={form.phone ?? ''} onChange={v => set('phone', v)} placeholder="(13) 99999-9999" />
      <Field label="Parentesco" value={form.relationship ?? ''} onChange={v => set('relationship', v)} placeholder="Ex: Avó, Tio, Vizinha..." />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-primary"
          checked={!!form.is_primary}
          onChange={e => set('is_primary', e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <label htmlFor="is-primary" className="text-sm text-gray-600">⭐ Contato principal</label>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
