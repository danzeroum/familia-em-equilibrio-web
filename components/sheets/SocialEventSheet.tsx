'use client'
import { useEffect, useState } from 'react'
import type { SocialEvent, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: SocialEvent | null
  onSave: (i: Partial<SocialEvent>) => Promise<void>
  members: Profile[]
}

const EVENT_TYPE_OPTIONS = [
  { value: 'birthday',    label: '🎂 Aniversário' },
  { value: 'anniversary', label: '💍 Aniversário de casamento' },
  { value: 'party',       label: '🎉 Festa' },
  { value: 'wedding',     label: '💒 Casamento' },
  { value: 'baby_shower', label: '🍼 Chá de bebê/revelação' },
  { value: 'holiday',     label: '🏖️ Feriado/férias' },
  { value: 'graduation',  label: '🎓 Formatura' },
  { value: 'other',       label: '📅 Outro' },
]

const STATUS_OPTIONS = [
  { value: 'planning',   label: '📝 Planejando' },
  { value: 'confirmed',  label: '✅ Confirmado' },
  { value: 'done',       label: '🎉 Realizado' },
  { value: 'cancelled',  label: '❌ Cancelado' },
]

export function SocialEventSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<SocialEvent>>({})

  useEffect(() => {
    setForm(item ?? { event_type: 'birthday', status: 'planning', cover_emoji: '🎉' })
  }, [item, open])

  const set = (k: keyof SocialEvent, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome do evento é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar evento' : 'Novo evento'} onClose={onClose}>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Tipo</label>
          <select className="input-base" value={form.event_type ?? 'birthday'} onChange={e => set('event_type', e.target.value)}>
            {EVENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Status</label>
          <select className="input-base" value={form.status ?? 'planning'} onChange={e => set('status', e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <Field
        label="Nome do evento *"
        value={form.name ?? ''}
        onChange={v => set('name', v)}
        placeholder="Ex: Aniversário da Ana (8 anos)"
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Homenageado / Ocasião</label>
        <select className="input-base" value={form.honoree_id ?? ''} onChange={e => set('honoree_id', e.target.value || null)}>
          <option value="">— Nenhum —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data" type="date" value={form.event_date ?? ''} onChange={v => set('event_date', v || null)} />
        <Field label="Horário" type="time" value={form.event_time ?? ''} onChange={v => set('event_time', v || null)} />
      </div>

      <div className="border-t pt-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">📍 Localização</p>
        <div className="flex flex-col gap-3">
          <Field
            label="Local / Nome do espaço"
            value={form.location_name ?? ''}
            onChange={v => set('location_name', v)}
            placeholder="Ex: Buffet Estrela, Casa da vovó"
          />
          <Field
            label="Endereço"
            value={form.address ?? ''}
            onChange={v => set('address', v)}
            placeholder="Ex: Rua das Flores, 100 — Bairro"
          />
          <Field
            label="Link (Maps, WhatsApp etc.)"
            value={form.location_url ?? ''}
            onChange={v => set('location_url', v)}
            placeholder="https://maps.google.com/..."
          />
        </div>
      </div>

      <Field
        label="Orçamento previsto (R$)"
        type="number"
        value={form.budget_planned != null ? String(form.budget_planned) : ''}
        onChange={v => set('budget_planned', v ? parseFloat(v) : null)}
        placeholder="Ex: 2500"
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Descrição / Observações</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          placeholder="Detalhes gerais do evento..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
