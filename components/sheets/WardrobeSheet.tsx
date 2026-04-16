'use client'
import { useEffect, useState } from 'react'
import type { WardrobeItem, Profile } from '@/types/database'

interface Props { open: boolean; onClose: () => void; item: WardrobeItem | null; onSave: (i: any) => Promise<void>; members: Profile[] }

export function WardrobeSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<WardrobeItem>>({})
  useEffect(() => { setForm(item ?? { quantity: 1, minimum_quantity: 1 }) }, [item])
  const set = (k: keyof WardrobeItem, v: any) => setForm(f => ({ ...f, [k]: v }))
  async function save() { await onSave(form); onClose() }
  if (!open) return null
  return (
    <SlideOver title={item ? 'Editar item' : 'Novo item'} onClose={onClose}>
      <div>
        <label className="text-sm text-gray-600">Membro</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>
      <Field label="Item *" value={form.item_type ?? ''} onChange={v => set('item_type', v)} placeholder="Ex: Camiseta, tênis, casaco..." />
      <Field label="Tamanho" value={form.size ?? ''} onChange={v => set('size', v)} placeholder="Ex: M, 36, 10 anos..." />
      <div>
        <label className="text-sm text-gray-600">Estação</label>
        <select className="input-base" value={form.season ?? ''} onChange={e => set('season', e.target.value)}>
          <option value="">— Todas —</option>
          <option value="verao">☀️ Verão</option>
          <option value="inverno">❄️ Inverno</option>
          <option value="meia_estacao">🌤️ Meia-estação</option>
          <option value="todos">🔄 Todos</option>
        </select>
      </div>
      <Field label="Quantidade atual" type="number" value={String(form.quantity ?? 1)} onChange={v => set('quantity', parseInt(v))} />
      <Field label="Quantidade mínima" type="number" value={String(form.minimum_quantity ?? 1)} onChange={v => set('minimum_quantity', parseInt(v))} />
      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
