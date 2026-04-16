'use client'
import { useEffect, useState } from 'react'
import type { Bill } from '@/types/database'

interface Props { open: boolean; onClose: () => void; bill: Bill | null; onSave: (b: any) => Promise<void> }

export function BillSheet({ open, onClose, bill, onSave }: Props) {
  const [form, setForm] = useState<Partial<Bill>>({})
  useEffect(() => { setForm(bill ?? { is_recurring: true, status: 'pending' }) }, [bill])
  const set = (k: keyof Bill, v: any) => setForm(f => ({ ...f, [k]: v }))
  async function save() { await onSave(form); onClose() }
  if (!open) return null
  return (
    <SlideOver title={bill ? 'Editar conta' : 'Nova conta'} onClose={onClose}>
      <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} />
      <Field label="Valor (R$)" type="number" value={String(form.amount ?? '')} onChange={v => set('amount', parseFloat(v))} />
      <Field label="Dia de vencimento" type="number" value={String(form.due_day ?? '')} onChange={v => set('due_day', parseInt(v))} />
      <div>
        <label className="text-sm text-gray-600">Método de pagamento</label>
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
      <Field label="Categoria" value={form.category ?? ''} onChange={v => set('category', v)} />
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={!!form.is_recurring} onChange={e => set('is_recurring', e.target.checked)} id="recurring" />
        <label htmlFor="recurring" className="text-sm text-gray-600">Recorrente (todo mês)</label>
      </div>
      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
