'use client'
import { useEffect, useState } from 'react'
import type { VehicleMaintenance, Vehicle, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: VehicleMaintenance | null
  onSave: (i: Partial<VehicleMaintenance>) => Promise<void>
  vehicles: Vehicle[]
  members: Profile[]
  defaultVehicleId?: string | null
}

const CATEGORY_OPTIONS = [
  { value: 'oleo',      label: '🛢️ Óleo / lubrificação' },
  { value: 'pneus',     label: '🛞 Pneus' },
  { value: 'freios',    label: '🛑 Freios' },
  { value: 'bateria',   label: '🔋 Bateria' },
  { value: 'revisao',   label: '🔧 Revisão geral' },
  { value: 'limpeza',   label: '🧼 Limpeza / estética' },
  { value: 'corrente',  label: '⛓️ Corrente / transmissão' },
  { value: 'outro',     label: '📎 Outro' },
]

const STATUS_OPTIONS = [
  { value: 'ok',       label: '✅ Em dia' },
  { value: 'due_soon', label: '🟡 Próximo do prazo' },
  { value: 'overdue',  label: '🔴 Vencido' },
  { value: 'done',     label: '✔️ Feito' },
]

export function VehicleMaintenanceSheet({ open, onClose, item, onSave, vehicles, members, defaultVehicleId }: Props) {
  const [form, setForm] = useState<Partial<VehicleMaintenance>>({})

  useEffect(() => {
    setForm(item ?? {
      status: 'ok',
      frequency_label: 'A cada 6 meses',
      vehicle_id: defaultVehicleId ?? vehicles[0]?.id,
    })
  }, [item, open, defaultVehicleId, vehicles])

  const set = (k: keyof VehicleMaintenance, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    if (!form.vehicle_id) { alert('Selecione um veículo'); return }
    if (!form.frequency_label?.trim()) { alert('Frequência é obrigatória'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar manutenção' : 'Nova manutenção'} onClose={onClose}>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Veículo *</label>
        <select className="input-base" value={form.vehicle_id ?? ''} onChange={e => set('vehicle_id', e.target.value)}>
          <option value="">— Selecione —</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.nickname}</option>)}
        </select>
      </div>

      <Field
        label="Título *"
        value={form.title ?? ''}
        onChange={v => set('title', v)}
        placeholder="Ex: Troca de óleo, Rodízio de pneus..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Emoji"
          value={form.emoji ?? ''}
          onChange={v => set('emoji', v)}
          placeholder="🛢️"
        />
        <div>
          <label className="text-sm text-gray-600 block mb-1">Categoria</label>
          <select className="input-base" value={form.category ?? ''} onChange={e => set('category', e.target.value || null)}>
            <option value="">— Nenhuma —</option>
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <Field
        label="Frequência (texto) *"
        value={form.frequency_label ?? ''}
        onChange={v => set('frequency_label', v)}
        placeholder="Ex: A cada 6 meses, A cada 10.000 km"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Freq. (dias)"
          type="number"
          value={form.frequency_days != null ? String(form.frequency_days) : ''}
          onChange={v => set('frequency_days', v ? parseInt(v) : null)}
          placeholder="180"
        />
        <Field
          label="Freq. (km)"
          type="number"
          value={form.frequency_km != null ? String(form.frequency_km) : ''}
          onChange={v => set('frequency_km', v ? parseInt(v) : null)}
          placeholder="10000"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Última vez (data)"
          type="date"
          value={form.last_done_at ?? ''}
          onChange={v => set('last_done_at', v || null)}
        />
        <Field
          label="Última vez (km)"
          type="number"
          value={form.last_done_km != null ? String(form.last_done_km) : ''}
          onChange={v => set('last_done_km', v ? parseInt(v) : null)}
          placeholder="45000"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Próxima (data)"
          type="date"
          value={form.next_due_at ?? ''}
          onChange={v => set('next_due_at', v || null)}
        />
        <Field
          label="Próxima (km)"
          type="number"
          value={form.next_due_km != null ? String(form.next_due_km) : ''}
          onChange={v => set('next_due_km', v ? parseInt(v) : null)}
          placeholder="55000"
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select className="input-base" value={form.status ?? 'ok'} onChange={e => set('status', e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select className="input-base" value={form.responsible_id ?? ''} onChange={e => set('responsible_id', e.target.value || null)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <Field
        label="Custo estimado (R$)"
        type="number"
        value={form.estimated_cost != null ? String(form.estimated_cost) : ''}
        onChange={v => set('estimated_cost', v ? parseFloat(v) : null)}
        placeholder="0,00"
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
