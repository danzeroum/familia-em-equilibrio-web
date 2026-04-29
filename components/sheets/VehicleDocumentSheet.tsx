'use client'
import { useEffect, useState } from 'react'
import type { VehicleDocument, Vehicle } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: VehicleDocument | null
  onSave: (i: Partial<VehicleDocument>) => Promise<void>
  vehicles: Vehicle[]
  defaultVehicleId?: string | null
}

const TYPE_OPTIONS = [
  { value: 'ipva',          label: '🧾 IPVA' },
  { value: 'licenciamento', label: '📄 Licenciamento' },
  { value: 'seguro',        label: '🛡️ Seguro' },
  { value: 'dpvat',         label: '🚑 DPVAT' },
  { value: 'vistoria',      label: '🔍 Vistoria' },
  { value: 'crlv',          label: '📋 CRLV' },
  { value: 'outro',         label: '📎 Outro' },
]

const STATUS_OPTIONS = [
  { value: 'pending', label: '⏳ Pendente' },
  { value: 'paid',    label: '✅ Pago' },
  { value: 'overdue', label: '⚠️ Vencido' },
  { value: 'renewed', label: '🔄 Renovado' },
]

export function VehicleDocumentSheet({ open, onClose, item, onSave, vehicles, defaultVehicleId }: Props) {
  const [form, setForm] = useState<Partial<VehicleDocument>>({})

  useEffect(() => {
    setForm(item ?? {
      type: 'ipva',
      status: 'pending',
      vehicle_id: defaultVehicleId ?? vehicles[0]?.id,
    })
  }, [item, open, defaultVehicleId, vehicles])

  const set = (k: keyof VehicleDocument, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    if (!form.vehicle_id) { alert('Selecione um veículo'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar documento' : 'Novo documento'} onClose={onClose}>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Veículo *</label>
        <select className="input-base" value={form.vehicle_id ?? ''} onChange={e => set('vehicle_id', e.target.value)}>
          <option value="">— Selecione —</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.nickname}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Tipo *</label>
        <select className="input-base" value={form.type ?? 'ipva'} onChange={e => set('type', e.target.value)}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Field
        label="Título *"
        value={form.title ?? ''}
        onChange={v => set('title', v)}
        placeholder="Ex: IPVA 2026, Seguro Porto..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Vencimento"
          type="date"
          value={form.due_date ?? ''}
          onChange={v => set('due_date', v || null)}
        />
        <Field
          label="Valor (R$)"
          type="number"
          value={form.amount != null ? String(form.amount) : ''}
          onChange={v => set('amount', v ? parseFloat(v) : null)}
          placeholder="0,00"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select className="input-base" value={form.status ?? 'pending'} onChange={e => set('status', e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {form.status === 'paid' && (
        <Field
          label="Data do pagamento"
          type="date"
          value={form.paid_at ?? ''}
          onChange={v => set('paid_at', v || null)}
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Ano referência"
          type="number"
          value={form.reference_year != null ? String(form.reference_year) : ''}
          onChange={v => set('reference_year', v ? parseInt(v) : null)}
          placeholder="2026"
        />
        <Field
          label="Nº apólice / doc"
          value={form.policy_number ?? ''}
          onChange={v => set('policy_number', v)}
          placeholder="123456"
        />
      </div>

      <Field
        label="Provedor / Seguradora"
        value={form.provider ?? ''}
        onChange={v => set('provider', v)}
        placeholder="Ex: Porto Seguro, Detran SP..."
      />

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
