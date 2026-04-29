'use client'
import { useEffect, useState } from 'react'
import type { Vehicle, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: Vehicle | null
  onSave: (i: Partial<Vehicle>) => Promise<void>
  members: Profile[]
}

const TYPE_OPTIONS = [
  { value: 'car',        label: '🚗 Carro' },
  { value: 'motorcycle', label: '🏍️ Moto' },
  { value: 'ebike',      label: '⚡ Bicicleta elétrica' },
  { value: 'bike',       label: '🚲 Bicicleta' },
  { value: 'scooter',    label: '🛴 Patinete' },
]

const FUEL_OPTIONS = [
  { value: 'gasoline', label: '⛽ Gasolina' },
  { value: 'ethanol',  label: '🌽 Etanol' },
  { value: 'flex',     label: '🔀 Flex' },
  { value: 'diesel',   label: '🛢️ Diesel' },
  { value: 'electric', label: '⚡ Elétrico' },
  { value: 'hybrid',   label: '🔋 Híbrido' },
  { value: 'none',     label: '— Sem combustível' },
]

export function VehicleSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<Vehicle>>({})

  useEffect(() => {
    setForm(item ?? { type: 'car', is_active: true, fuel_type: 'flex' })
  }, [item, open])

  const set = (k: keyof Vehicle, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.nickname?.trim()) { alert('Apelido é obrigatório'); return }
    if (!form.type) { alert('Tipo é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  const isMotor = form.type === 'car' || form.type === 'motorcycle'
  const isElectric = form.type === 'ebike' || form.fuel_type === 'electric'

  return (
    <SlideOver title={item ? 'Editar veículo' : 'Novo veículo'} onClose={onClose}>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Tipo *</label>
        <select className="input-base" value={form.type ?? 'car'} onChange={e => set('type', e.target.value)}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Field
        label="Apelido *"
        value={form.nickname ?? ''}
        onChange={v => set('nickname', v)}
        placeholder="Ex: Carro do dia, Moto da Ana, Bike azul..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Marca" value={form.brand ?? ''} onChange={v => set('brand', v)} placeholder="Ex: Toyota, Caloi..." />
        <Field label="Modelo" value={form.model ?? ''} onChange={v => set('model', v)} placeholder="Ex: Corolla, Elite..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Ano"
          type="number"
          value={form.year != null ? String(form.year) : ''}
          onChange={v => set('year', v ? parseInt(v) : null)}
          placeholder="2024"
        />
        <Field label="Cor" value={form.color ?? ''} onChange={v => set('color', v)} placeholder="Ex: Prata" />
      </div>

      {isMotor && (
        <>
          <Field
            label="Placa"
            value={form.plate ?? ''}
            onChange={v => set('plate', v.toUpperCase())}
            placeholder="ABC1D23"
          />
          <div>
            <label className="text-sm text-gray-600 block mb-1">Combustível</label>
            <select className="input-base" value={form.fuel_type ?? 'flex'} onChange={e => set('fuel_type', e.target.value)}>
              {FUEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </>
      )}

      <Field
        label="Quilometragem atual (km)"
        type="number"
        value={form.current_km != null ? String(form.current_km) : ''}
        onChange={v => set('current_km', v ? parseInt(v) : null)}
        placeholder="Ex: 45000"
      />

      {isElectric && (
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Bateria (kWh)"
            type="number"
            value={form.battery_kwh != null ? String(form.battery_kwh) : ''}
            onChange={v => set('battery_kwh', v ? parseFloat(v) : null)}
            placeholder="Ex: 0.5"
          />
          <Field
            label="Autonomia (km)"
            type="number"
            value={form.battery_range_km != null ? String(form.battery_range_km) : ''}
            onChange={v => set('battery_range_km', v ? parseInt(v) : null)}
            placeholder="Ex: 60"
          />
        </div>
      )}

      <div>
        <label className="text-sm text-gray-600 block mb-1">Dono / Responsável</label>
        <select className="input-base" value={form.owner_id ?? ''} onChange={e => set('owner_id', e.target.value || null)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <Field
        label="Local da garagem"
        value={form.garage_location ?? ''}
        onChange={v => set('garage_location', v)}
        placeholder="Ex: Vaga 12, garagem do prédio"
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_active ?? true}
          onChange={e => set('is_active', e.target.checked)}
          className="accent-teal-600"
        />
        <span className="text-sm">Ativo (em uso)</span>
      </label>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Detalhes, seguradora, chassi..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
