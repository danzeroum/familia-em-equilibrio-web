'use client'
import { useEffect, useState } from 'react'
import type { SchoolSupply, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: SchoolSupply | null
  defaultCategory?: SchoolSupply['category']
  onSave: (i: any) => Promise<void>
  members: Profile[]
}

const CATEGORY_OPTIONS: { value: SchoolSupply['category']; label: string }[] = [
  { value: 'material',  label: '📦 Material básico' },
  { value: 'uniforme',  label: '👕 Uniforme' },
  { value: 'livro',     label: '📚 Livro' },
  { value: 'sazonal',   label: '🍂 Sazonal' },
  { value: 'outro',     label: '📝 Outro' },
]

const STATUS_OPTIONS: { value: SchoolSupply['status']; label: string }[] = [
  { value: 'needed',       label: '🛒 A comprar' },
  { value: 'running_out',  label: '⚠️ Acabando' },
  { value: 'bought',       label: '✅ Comprado' },
]

export function SchoolSupplySheet({ open, onClose, item, defaultCategory = 'material', onSave, members }: Props) {
  const [form, setForm] = useState<Partial<SchoolSupply>>({})

  useEffect(() => {
    setForm(item ?? {
      category: defaultCategory,
      status: 'needed',
      quantity_need: 1,
      quantity_have: 0,
    })
  }, [item, open, defaultCategory])

  const set = (k: keyof SchoolSupply, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome do item é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar material' : 'Novo material escolar'} onClose={onClose}>
      <div>
        <label className="text-sm text-gray-600 block mb-1">Criança</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value || null)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <Field label="Item *" value={form.name ?? ''} onChange={v => set('name', v)} placeholder="Ex: Caderno grande, lápis de cor..." />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Categoria</label>
          <select className="input-base" value={form.category ?? 'material'} onChange={e => set('category', e.target.value as any)}>
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Status</label>
          <select className="input-base" value={form.status ?? 'needed'} onChange={e => set('status', e.target.value as any)}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Qtd necessária" type="number" value={String(form.quantity_need ?? 1)} onChange={v => set('quantity_need', parseInt(v) || 0)} />
        <Field label="Qtd em casa" type="number" value={String(form.quantity_have ?? 0)} onChange={v => set('quantity_have', parseInt(v) || 0)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço unitário (R$)" type="number" value={form.unit_price != null ? String(form.unit_price) : ''} onChange={v => set('unit_price', v === '' ? null : parseFloat(v))} placeholder="0.00" />
        <div>
          <label className="text-sm text-gray-600 block mb-1">Estação</label>
          <select className="input-base" value={form.season ?? ''} onChange={e => set('season', e.target.value ? e.target.value as any : null)}>
            <option value="">— Nenhuma —</option>
            <option value="todas">🔄 Todas</option>
            <option value="verao">☀️ Verão</option>
            <option value="inverno">❄️ Inverno</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea className="input-base resize-none" rows={2} placeholder="Marca, onde comprar, etiquetar com nome..." value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
