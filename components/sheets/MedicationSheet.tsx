'use client'
import { useEffect, useState } from 'react'
import type { Medication, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  medication: Medication | null
  onSave: (m: any) => Promise<void>
  members: Profile[]
}

export function MedicationSheet({ open, onClose, medication, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<Medication>>({})

  useEffect(() => {
    setForm(medication ?? { stock_quantity: 0, minimum_stock: 2, is_active: true })
  }, [medication, open])

  const set = (k: keyof Medication, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={medication ? 'Editar remédio' : 'Novo remédio'} onClose={onClose}>
      <Field label="Nome *" value={form.name ?? ''} onChange={v => set('name', v)} placeholder="Ex: Dipirona, Amoxicilina..." />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Membro</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value)}>
          <option value="">— Família —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Forma</label>
          <select className="input-base" value={form.form ?? ''} onChange={e => set('form', e.target.value)}>
            <option value="">—</option>
            <option value="comprimido">Comprimido</option>
            <option value="capsula">Cápsula</option>
            <option value="liquido">Líquido</option>
            <option value="pomada">Pomada</option>
            <option value="gotas">Gotas</option>
            <option value="injetavel">Injetável</option>
          </select>
        </div>
        <Field label="Dosagem" value={form.dosage ?? ''} onChange={v => set('dosage', v)} placeholder="Ex: 500mg" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Estoque atual" type="number" value={String(form.stock_quantity ?? 0)} onChange={v => set('stock_quantity', parseInt(v) || 0)} />
        <Field label="Estoque mínimo" type="number" value={String(form.minimum_stock ?? 2)} onChange={v => set('minimum_stock', parseInt(v) || 1)} />
      </div>

      <Field label="Validade" type="date" value={form.expiry_date ?? ''} onChange={v => set('expiry_date', v)} />
      <Field label="Local de armazenamento" value={form.storage_location ?? ''} onChange={v => set('storage_location', v)} placeholder="Ex: Armário banheiro, geladeira..." />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is-active"
          checked={!!form.is_active}
          onChange={e => set('is_active', e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <label htmlFor="is-active" className="text-sm text-gray-600">Em uso atualmente</label>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
