'use client'
import { useEffect, useState } from 'react'
import type { WardrobeItem, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: WardrobeItem | null
  onSave: (i: any) => Promise<void>
  members: Profile[]
}

const STATUS_OPTIONS = [
  { value: 'fitting', label: '✅ Serve' },
  { value: 'outgrown', label: '📦 Pequeno' },
  { value: 'to_buy', label: '🛒 Comprar' },
  { value: 'donate', label: '🎁 Doação' },
]

export function WardrobeSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<WardrobeItem>>({})

  useEffect(() => {
    setForm(item ?? { quantity: 1, minimum_quantity: 1, status: 'fitting' })
  }, [item, open])

  const set = (k: keyof WardrobeItem, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.item_type?.trim()) { alert('Nome do item é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar item' : 'Novo item de vestuário'} onClose={onClose}>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Membro</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value || undefined as any)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <Field label="Item *" value={form.item_type ?? ''} onChange={v => set('item_type', v)} placeholder="Ex: Moletom, calça jeans, tênis..." />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tamanho" value={form.size ?? ''} onChange={v => set('size', v)} placeholder="Ex: M, 38, 10 anos" />
        <div>
          <label className="text-sm text-gray-600 block mb-1">Estação</label>
          <select className="input-base" value={form.season ?? 'all'} onChange={e => set('season', e.target.value as any)}>
            <option value="all">🔄 Todas</option>
            <option value="summer">☀️ Verão</option>
            <option value="winter">❄️ Inverno</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Qtd atual" type="number" value={String(form.quantity ?? 1)} onChange={v => set('quantity', parseInt(v) || 0)} />
        <Field label="Mínimo ideal" type="number" value={String(form.minimum_quantity ?? 1)} onChange={v => set('minimum_quantity', parseInt(v) || 1)} />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select className="input-base" value={form.status ?? 'fitting'} onChange={e => set('status', e.target.value as any)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável pela ação</label>
        <select className="input-base" value={(form as any).responsible_id ?? ''} onChange={e => set('responsible_id' as any, e.target.value || null)}>
          <option value="">— Nenhum —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <Field label="Ação necessária" value={(form as any).action_description ?? ''} onChange={v => set('action_description' as any, v)} placeholder="Ex: Comprar na feira, separar p/ doação..." />

      <Field label="Data da ação" type="date" value={(form as any).action_date ?? ''} onChange={v => set('action_date' as any, v)} />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea className="input-base resize-none" rows={2} placeholder="Marca, cor, onde comprar..." value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
