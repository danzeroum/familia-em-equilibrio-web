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

export function WardrobeSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<WardrobeItem>>({})

  useEffect(() => {
    setForm(item ?? { quantity: 1, minimum_quantity: 1 })
  }, [item, open])

  const set = (k: keyof WardrobeItem, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.item_type?.trim()) { alert('Nome do item é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar item' : 'Novo item'} onClose={onClose}>

      {/* Membro */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Membro</label>
        <select
          className="input-base"
          value={form.profile_id ?? ''}
          onChange={e => set('profile_id', e.target.value)}
        >
          <option value="">— Família —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>
          ))}
        </select>
      </div>

      {/* Nome do item */}
      <Field
        label="Item *"
        value={form.item_type ?? ''}
        onChange={v => set('item_type', v)}
        placeholder="Ex: Camiseta, tênis, casaco..."
      />

      {/* Tamanho */}
      <Field
        label="Tamanho"
        value={form.size ?? ''}
        onChange={v => set('size', v)}
        placeholder="Ex: M, 36, 10 anos..."
      />

      {/* Estação */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Estação</label>
        <select
          className="input-base"
          value={form.season ?? ''}
          onChange={e => set('season', e.target.value)}
        >
          <option value="">— Todas —</option>
          <option value="verao">☀️ Verão</option>
          <option value="inverno">❄️ Inverno</option>
          <option value="meia_estacao">🌤️ Meia-estação</option>
          <option value="todos">🔄 Todos</option>
        </select>
      </div>

      {/* Quantidade atual + mínima lado a lado */}
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Qtd atual"
          type="number"
          value={String(form.quantity ?? 1)}
          onChange={v => set('quantity', parseInt(v) || 0)}
        />
        <Field
          label="Qtd mínima"
          type="number"
          value={String(form.minimum_quantity ?? 1)}
          onChange={v => set('minimum_quantity', parseInt(v) || 1)}
        />
      </div>

      {/* Observações */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Marca, cor, onde comprar..."
          value={(form as any).notes ?? ''}
          onChange={e => set('notes' as any, e.target.value)}
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
