'use client'
import { useEffect, useState } from 'react'
import type { VehicleCall, Vehicle } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: VehicleCall | null
  onSave: (i: Partial<VehicleCall>) => Promise<void>
  vehicles: Vehicle[]
  defaultVehicleId?: string | null
}

const PRIORITY_OPTIONS = [
  { value: 1, label: '🔴 Crítico — resolver logo' },
  { value: 2, label: '🟡 Importante — em breve' },
  { value: 3, label: '⚪ Quando puder' },
]

const STATUS_OPTIONS = [
  { value: 'pending',   label: '⏳ Pendente (sem data)' },
  { value: 'scheduled', label: '📅 Agendado' },
  { value: 'done',      label: '✅ Resolvido' },
]

export function VehicleCallSheet({ open, onClose, item, onSave, vehicles, defaultVehicleId }: Props) {
  const [form, setForm] = useState<Partial<VehicleCall>>({})

  useEffect(() => {
    setForm(item ?? {
      status: 'pending',
      priority: 2,
      vehicle_id: defaultVehicleId ?? vehicles[0]?.id,
    })
  }, [item, open, defaultVehicleId, vehicles])

  const set = (k: keyof VehicleCall, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Problema é obrigatório'); return }
    if (!form.vehicle_id) { alert('Selecione um veículo'); return }
    const payload = {
      ...form,
      scheduled_date: form.status === 'pending' ? null : (form.scheduled_date ?? null),
    }
    await onSave(payload)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar reparo' : 'Registrar reparo'} onClose={onClose}>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Veículo *</label>
        <select className="input-base" value={form.vehicle_id ?? ''} onChange={e => set('vehicle_id', e.target.value)}>
          <option value="">— Selecione —</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.nickname}</option>)}
        </select>
      </div>

      <Field
        label="Problema *"
        value={form.title ?? ''}
        onChange={v => set('title', v)}
        placeholder="Ex: Barulho no motor, pneu furado..."
      />

      <Field
        label="Descrição"
        value={form.description ?? ''}
        onChange={v => set('description', v)}
        placeholder="Detalhes do problema, quando começou..."
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Urgência</label>
        <div className="flex flex-col gap-1.5">
          {PRIORITY_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value={o.value}
                checked={(form.priority ?? 2) === o.value}
                onChange={() => set('priority', o.value)}
                className="accent-teal-600"
              />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select className="input-base" value={form.status ?? 'pending'} onChange={e => set('status', e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {form.status === 'scheduled' && (
        <Field
          label="Data agendada"
          type="date"
          value={form.scheduled_date ?? ''}
          onChange={v => set('scheduled_date', v || null)}
        />
      )}

      <Field
        label="Oficina / Profissional"
        value={form.professional_name ?? ''}
        onChange={v => set('professional_name', v)}
        placeholder="Ex: Auto Center do Zé"
      />

      <Field
        label="Telefone"
        value={form.professional_phone ?? ''}
        onChange={v => set('professional_phone', v)}
        placeholder="(11) 99999-9999"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Custo estimado (R$)"
          type="number"
          value={form.estimated_cost != null ? String(form.estimated_cost) : ''}
          onChange={v => set('estimated_cost', v ? parseFloat(v) : null)}
          placeholder="0,00"
        />
        <Field
          label="Custo real (R$)"
          type="number"
          value={form.actual_cost != null ? String(form.actual_cost) : ''}
          onChange={v => set('actual_cost', v ? parseFloat(v) : null)}
          placeholder="0,00"
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
