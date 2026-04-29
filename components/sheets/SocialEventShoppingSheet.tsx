'use client'
import { useEffect, useState } from 'react'
import type { SocialEventShopping, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: SocialEventShopping | null
  eventId: string | null
  onSave: (i: Partial<SocialEventShopping>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  members: Profile[]
}

const CATEGORY_OPTIONS = [
  { value: 'decoracao',   label: '🎀 Decoração' },
  { value: 'alimentacao', label: '🍕 Alimentação' },
  { value: 'bebidas',     label: '🥤 Bebidas' },
  { value: 'doceria',     label: '🎂 Doceria / bolo' },
  { value: 'lembrancas',  label: '🎁 Lembranças' },
  { value: 'convites',    label: '📨 Convites' },
  { value: 'vestuario',   label: '👗 Vestuário' },
  { value: 'outros',      label: '📦 Outros' },
]

export function SocialEventShoppingSheet({ open, onClose, item, eventId, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<SocialEventShopping>>({})

  useEffect(() => {
    setForm(item ?? { is_bought: false, quantity: 1, unit: 'un', event_id: eventId ?? undefined })
  }, [item, open, eventId])

  const set = (k: keyof SocialEventShopping, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome do item é obrigatório'); return }
    if (!form.event_id) { alert('Selecione um evento'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar item' : 'Novo item de compras'} onClose={onClose}>

      <Field
        label="Nome do item *"
        value={form.name ?? ''}
        onChange={v => set('name', v)}
        placeholder="Ex: Balões coloridos"
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Categoria</label>
        <select className="input-base" value={form.category ?? ''} onChange={e => set('category', e.target.value || null)}>
          <option value="">— Sem categoria —</option>
          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Quantidade"
          type="number"
          value={form.quantity != null ? String(form.quantity) : ''}
          onChange={v => set('quantity', v ? parseFloat(v) : null)}
          placeholder="1"
        />
        <Field
          label="Unidade"
          value={form.unit ?? ''}
          onChange={v => set('unit', v)}
          placeholder="un, kg, m, pacote..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Preço estimado (R$)"
          type="number"
          value={form.estimated_price != null ? String(form.estimated_price) : ''}
          onChange={v => set('estimated_price', v ? parseFloat(v) : null)}
          placeholder="0,00"
        />
        <Field
          label="Preço real (R$)"
          type="number"
          value={form.actual_price != null ? String(form.actual_price) : ''}
          onChange={v => set('actual_price', v ? parseFloat(v) : null)}
          placeholder="0,00"
        />
      </div>

      <Field
        label="Loja / Fornecedor"
        value={form.store ?? ''}
        onChange={v => set('store', v)}
        placeholder="Ex: Americanas, Mercado local..."
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável pela compra</label>
        <select className="input-base" value={form.assigned_to ?? ''} onChange={e => set('assigned_to', e.target.value || null)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_bought ?? false}
          onChange={e => set('is_bought', e.target.checked)}
          className="accent-teal-600"
        />
        <span className="text-sm">Já foi comprado</span>
      </label>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
