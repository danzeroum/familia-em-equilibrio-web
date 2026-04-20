'use client'
import { useEffect, useState } from 'react'
import type { ShoppingItem, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: ShoppingItem | null
  onSave: (b: Partial<ShoppingItem>) => Promise<void>
  members: Profile[]
}

export function GrocerySheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<ShoppingItem>>({})

  useEffect(() => {
    setForm(item ?? { status: 'needed', is_recurring: false })
  }, [item, open])

  const set = (k: keyof ShoppingItem, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome do item é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar item' : 'Novo item de mercado'} onClose={onClose}>
      <Field
        label="O que precisamos? *"
        value={form.name ?? ''}
        onChange={v => set('name', v)}
        placeholder="Ex: Banana, leite, arroz..."
      />

      <Field
        label="Quantidade / Medida"
        value={form.quantity ?? ''}
        onChange={v => set('quantity', v)}
        placeholder="Ex: 2 kg, 1 litro, 6 unidades..."
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Para quem?</label>
        <select
          className="input-base"
          value={form.requested_by ?? ''}
          onChange={e => set('requested_by', e.target.value || null)}
        >
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select
          className="input-base"
          value={form.status ?? 'needed'}
          onChange={e => set('status', e.target.value as ShoppingItem['status'])}
        >
          <option value="needed">🛒 A Comprar</option>
          <option value="running_out">⚠️ A Acabar (Urgente)</option>
          <option value="bought">✅ Já Comprado</option>
        </select>
      </div>

      <div className="flex items-center gap-2 mt-2 p-3 border rounded bg-gray-50">
        <input
          type="checkbox"
          id="recurringGrocery"
          checked={!!form.is_recurring}
          onChange={e => set('is_recurring', e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <label htmlFor="recurringGrocery" className="text-sm text-gray-700">
          <strong>🔄 Compra recorrente</strong><br />
          <span className="text-xs text-gray-500">Mantém no radar mesmo depois de comprado</span>
        </label>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
