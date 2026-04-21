'use client'

import { useEffect, useState } from 'react'
import { SlideOver, Field, SaveCancel } from './_shared'
import type { PharmacyItem } from '@/hooks/usePharmacyItems'
import type { Profile } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  item: PharmacyItem | null
  onSave: (item: Partial<PharmacyItem> & { name: string }) => Promise<void>
  members: Profile[]
}

const EMPTY: Partial<PharmacyItem> = {
  name: '',
  quantity: '',
  unit: '',
  priority: null,
  notes: '',
  assigned_to: null,
  status: 'pending',
}

export function PharmacyItemSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<PharmacyItem>>(EMPTY)

  useEffect(() => {
    setForm(item ?? EMPTY)
  }, [item, open])

  const set = (k: keyof PharmacyItem, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome é obrigatório'); return }
    await onSave({ ...form, name: form.name.trim() } as Partial<PharmacyItem> & { name: string })
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar item' : 'Novo item de farmácia'} onClose={onClose}>
      <Field
        label="Nome *"
        value={form.name ?? ''}
        onChange={v => set('name', v)}
        placeholder="Ex: Dipirona, Fralda G, Vitamina C..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Quantidade"
          value={form.quantity ?? ''}
          onChange={v => set('quantity', v)}
          placeholder="Ex: 1, 2, 3..."
        />
        <Field
          label="Unidade"
          value={form.unit ?? ''}
          onChange={v => set('unit', v)}
          placeholder="cx, un, fr..."
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Prioridade</label>
        <select
          className="input-base"
          value={form.priority ?? ''}
          onChange={e => set('priority', e.target.value || null)}
        >
          <option value="">— Sem prioridade —</option>
          <option value="high">🔴 Alta</option>
          <option value="medium">🟡 Média</option>
          <option value="low">🟢 Baixa</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável por comprar</label>
        <select
          className="input-base"
          value={form.assigned_to ?? ''}
          onChange={e => set('assigned_to', e.target.value || null)}
        >
          <option value="">— Qualquer um —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {(m as any).emoji ?? ''} {(m as any).nickname ?? (m as any).name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="Ex: marca específica, genérico ok, urgente..."
        />
      </div>

      {item && (
        <div>
          <label className="text-sm text-gray-600 block mb-1">Status</label>
          <select
            className="input-base"
            value={form.status ?? 'pending'}
            onChange={e => set('status', e.target.value as any)}
          >
            <option value="pending">⏳ Pendente</option>
            <option value="bought">✅ Comprado</option>
            <option value="cancelled">⏭️ Cancelado</option>
          </select>
        </div>
      )}

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
