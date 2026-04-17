'use client'
import { useEffect, useState } from 'react'
import type { Bill } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  bill: Bill | null
  onSave: (b: any) => Promise<void>
}

export function BillSheet({ open, onClose, bill, onSave }: Props) {
  const [form, setForm] = useState<Partial<Bill>>({})

  useEffect(() => {
    setForm(bill ?? { is_recurring: true, status: 'pending' })
  }, [bill, open])

  const set = (k: keyof Bill, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={bill ? 'Editar conta' : 'Nova conta'} onClose={onClose}>
      <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} placeholder="Ex: Conta de luz, Netflix..." />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Valor (R$)" type="number" value={String(form.amount ?? '')} onChange={v => set('amount', parseFloat(v))} placeholder="0,00" />
        <Field label="Dia de vencimento" type="number" value={String(form.due_day ?? '')} onChange={v => set('due_day', parseInt(v))} placeholder="Ex: 10" />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Método de pagamento</label>
        <select className="input-base" value={form.payment_method ?? ''} onChange={e => set('payment_method', e.target.value)}>
          <option value="">—</option>
          <option value="credit_card">💳 Cartão de crédito</option>
          <option value="debit_card">💳 Cartão de débito</option>
          <option value="pix">📱 Pix</option>
          <option value="bank_slip">🏦 Boleto</option>
          <option value="auto_debit">🔄 Débito automático</option>
          <option value="cash">💵 Dinheiro</option>
        </select>
      </div>

      <Field label="Categoria" value={form.category ?? ''} onChange={v => set('category', v)} placeholder="Ex: Moradia, Serviços, Lazer..." />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="recurring"
          checked={!!form.is_recurring}
          onChange={e => set('is_recurring', e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <label htmlFor="recurring" className="text-sm text-gray-600">🔄 Recorrente (todo mês)</label>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
