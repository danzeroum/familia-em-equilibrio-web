'use client'
import { useEffect, useState } from 'react'
import type { PantryItem } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: PantryItem | null
  onSave: (b: Partial<PantryItem>) => Promise<void>
}

const CATEGORIES = [
  { value: 'graos',      label: '🌾 Grãos e cereais' },
  { value: 'oleos',      label: '🫒 Óleos e vinagres' },
  { value: 'temperos',   label: '🧂 Temperos e molhos' },
  { value: 'enlatados',  label: '🥫 Enlatados' },
  { value: 'laticinios', label: '🥛 Laticínios' },
  { value: 'congelados', label: '🧊 Congelados' },
  { value: 'bebidas',    label: '🥤 Bebidas' },
  { value: 'snacks',     label: '🍿 Snacks e doces' },
  { value: 'outros',     label: '📦 Outros' },
]

const UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pct']

export function PantrySheet({ open, onClose, item, onSave }: Props) {
  const [form, setForm] = useState<Partial<PantryItem>>({})

  useEffect(() => {
    setForm(item ?? { quantity: 1, minimum_quantity: 1, unit: 'un', category: 'graos' })
  }, [item, open])

  const set = (k: keyof PantryItem, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar item da despensa' : 'Novo item na despensa'} onClose={onClose}>

      <div className="grid grid-cols-[1fr_4fr] gap-3">
        <Field label="Emoji" value={form.emoji ?? ''} onChange={v => set('emoji', v)} placeholder="🍚" />
        <Field label="Nome *" value={form.name ?? ''} onChange={v => set('name', v)} placeholder="Ex: Arroz, óleo de girassol..." />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Categoria</label>
        <select className="input-base" value={form.category ?? ''} onChange={e => set('category', e.target.value || null)}>
          <option value="">— Nenhuma —</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-[2fr_1fr_2fr] gap-3">
        <Field
          label="Qtd atual"
          type="number"
          value={form.quantity != null ? String(form.quantity) : ''}
          onChange={v => set('quantity', v ? parseFloat(v) : null)}
          placeholder="2"
        />
        <div>
          <label className="text-sm text-gray-600 block mb-1">Un</label>
          <select className="input-base" value={form.unit ?? 'un'} onChange={e => set('unit', e.target.value)}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <Field
          label="Mínimo ideal"
          type="number"
          value={form.minimum_quantity != null ? String(form.minimum_quantity) : ''}
          onChange={v => set('minimum_quantity', v ? parseFloat(v) : null)}
          placeholder="1"
        />
      </div>

      <Field
        label="Validade"
        type="date"
        value={form.expiry_date ?? ''}
        onChange={v => set('expiry_date', v || null)}
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Marca, onde guarda..."
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
