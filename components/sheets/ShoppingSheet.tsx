'use client'
import { useEffect, useState } from 'react'
import type { ShoppingItem } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: ShoppingItem | null
  onSave: (b: any) => Promise<void>
}

export function ShoppingSheet({ open, onClose, item, onSave }: Props) {
  const [form, setForm] = useState<Partial<ShoppingItem>>({})

  useEffect(() => {
    setForm(item ?? { status: 'needed', is_recurring: false })
  }, [item, open])

  const set = (k: keyof ShoppingItem, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome do produto é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar Item' : 'Novo Item na Lista'} onClose={onClose}>
      <Field label="O que precisamos? *" value={form.name ?? ''} onChange={v => set('name', v)} placeholder="Ex: Leite Meio Gordo, Papel Higiênico..." />

      <Field label="Quantidade / Medida" value={form.quantity ?? ''} onChange={v => set('quantity', v)} placeholder="Ex: 2 litros, 500g, 1 pack..." />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status atual</label>
        <select className="input-base" value={form.status ?? 'needed'} onChange={e => set('status', e.target.value as ShoppingItem['status'])}>
          <option value="needed">🛒 A Comprar</option>
          <option value="running_out">⚠️ A Acabar (Urgente)</option>
          <option value="bought">✅ Já Comprado</option>
        </select>
      </div>

      <div className="flex items-center gap-2 mt-4 p-3 border rounded bg-gray-50">
        <input
          type="checkbox"
          id="recurringItem"
          checked={!!form.is_recurring}
          onChange={e => set('is_recurring', e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <label htmlFor="recurringItem" className="text-sm text-gray-700">
          <strong>🔄 Produto Recorrente</strong><br/>
          (Mantém o item no radar para compras futuras)
        </label>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
