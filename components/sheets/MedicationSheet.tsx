'use client'
import { useEffect, useState } from 'react'
import type { Medication, Profile } from '@/types/database'

interface Props { open: boolean; onClose: () => void; medication: Medication | null; onSave: (m: any) => Promise<void>; members: Profile[] }

export function MedicationSheet({ open, onClose, medication, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<Medication>>({})
  useEffect(() => { setForm(medication ?? { stock_quantity: 0, minimum_stock: 2, is_active: true }) }, [medication])
  const set = (k: keyof Medication, v: any) => setForm(f => ({ ...f, [k]: v }))
  async function save() { await onSave(form); onClose() }
  if (!open) return null
  return (
    <SlideOver title={medication ? 'Editar remédio' : 'Novo remédio'} onClose={onClose}>
      <Field label="Nome *" value={form.name ?? ''} onChange={v => set('name', v)} />
      <div>
        <label className="text-sm text-gray-600">Membro</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm text-gray-600">Forma</label>
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
      <Field label="Dosagem (ex: 500mg)" value={form.dosage ?? ''} onChange={v => set('dosage', v)} />
      <Field label="Concentração (mg/ml)" type="number" value={String(form.concentration_mg_ml ?? '')} onChange={v => set('concentration_mg_ml', parseFloat(v))} />
      <Field label="Validade" type="date" value={form.expiry_date ?? ''} onChange={v => set('expiry_date', v)} />
      <Field label="Estoque atual" type="number" value={String(form.stock_quantity ?? 0)} onChange={v => set('stock_quantity', parseInt(v))} />
      <Field label="Estoque mínimo" type="number" value={String(form.minimum_stock ?? 2)} onChange={v => set('minimum_stock', parseInt(v))} />
      <Field label="Local de armazenamento" value={form.storage_location ?? ''} onChange={v => set('storage_location', v)} />
      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
