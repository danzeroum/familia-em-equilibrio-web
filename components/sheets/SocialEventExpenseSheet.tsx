'use client'
import { useEffect, useState } from 'react'
import type { SocialEventExpense, SocialEventContact } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: SocialEventExpense | null
  eventId: string | null
  vendors: SocialEventContact[]
  onSave: (i: Partial<SocialEventExpense>) => Promise<void>
}

const CATEGORY_OPTIONS = [
  { value: 'espaco',      label: '🏛️ Espaço / Local' },
  { value: 'alimentacao', label: '🍕 Alimentação' },
  { value: 'bebidas',     label: '🥤 Bebidas' },
  { value: 'bolo',        label: '🎂 Bolo / Confeitaria' },
  { value: 'decoracao',   label: '🎀 Decoração' },
  { value: 'musica',      label: '🎵 Música / DJ' },
  { value: 'fotografia',  label: '📷 Foto / Vídeo' },
  { value: 'animacao',    label: '🤹 Animação' },
  { value: 'convites',    label: '📨 Convites' },
  { value: 'lembrancas',  label: '🎁 Lembranças' },
  { value: 'transporte',  label: '🚌 Transporte' },
  { value: 'outros',      label: '📦 Outros' },
]

export function SocialEventExpenseSheet({ open, onClose, item, eventId, vendors, onSave }: Props) {
  const [form, setForm] = useState<Partial<SocialEventExpense>>({})

  useEffect(() => {
    setForm(item ?? { payment_status: 'pending', event_id: eventId ?? undefined })
  }, [item, open, eventId])

  const set = (k: keyof SocialEventExpense, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.description?.trim()) { alert('Descrição é obrigatória'); return }
    if (!form.event_id) { alert('Selecione um evento'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar despesa' : 'Nova despesa'} onClose={onClose}>

      <Field
        label="Descrição *"
        value={form.description ?? ''}
        onChange={v => set('description', v)}
        placeholder="Ex: Aluguel do buffet"
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
          label="Valor previsto (R$)"
          type="number"
          value={form.planned_amount != null ? String(form.planned_amount) : ''}
          onChange={v => set('planned_amount', v ? parseFloat(v) : null)}
          placeholder="0,00"
        />
        <Field
          label="Valor real (R$)"
          type="number"
          value={form.actual_amount != null ? String(form.actual_amount) : ''}
          onChange={v => set('actual_amount', v ? parseFloat(v) : null)}
          placeholder="0,00"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status do pagamento</label>
        <select className="input-base" value={form.payment_status ?? 'pending'} onChange={e => set('payment_status', e.target.value)}>
          <option value="pending">⏳ Pendente</option>
          <option value="partial">🔶 Parcial</option>
          <option value="paid">✅ Pago</option>
        </select>
      </div>

      <Field
        label="Vencimento"
        type="date"
        value={form.due_date ?? ''}
        onChange={v => set('due_date', v || null)}
      />

      {vendors.length > 0 && (
        <div>
          <label className="text-sm text-gray-600 block mb-1">Fornecedor (opcional)</label>
          <select className="input-base" value={form.vendor_id ?? ''} onChange={e => set('vendor_id', e.target.value || null)}>
            <option value="">— Nenhum —</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      )}

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
