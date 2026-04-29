'use client'
import { useEffect, useState } from 'react'
import type { SocialEventContact } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: SocialEventContact | null
  eventId: string | null
  onSave: (i: Partial<SocialEventContact>) => Promise<void>
}

const VENDOR_TYPE_OPTIONS = [
  { value: 'buffet',       label: '🍽️ Buffet' },
  { value: 'dj',           label: '🎵 DJ / Música' },
  { value: 'decoracao',    label: '🎀 Decoração' },
  { value: 'fotografia',   label: '📷 Fotografia/Vídeo' },
  { value: 'confeitaria',  label: '🎂 Confeitaria / Bolo' },
  { value: 'animacao',     label: '🤹 Animação / Recreação' },
  { value: 'transporte',   label: '🚌 Transporte' },
  { value: 'outros',       label: '📦 Outros' },
]

export function SocialEventContactSheet({ open, onClose, item, eventId, onSave }: Props) {
  const [form, setForm] = useState<Partial<SocialEventContact>>({})

  useEffect(() => {
    setForm(item ?? { role: 'guest', rsvp_status: 'pending', party_size: 1, event_id: eventId ?? undefined })
  }, [item, open, eventId])

  const set = (k: keyof SocialEventContact, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome é obrigatório'); return }
    if (!form.event_id) { alert('Selecione um evento'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  const isVendor = form.role === 'vendor'

  return (
    <SlideOver title={item ? 'Editar contato' : 'Novo contato'} onClose={onClose}>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Tipo</label>
        <select className="input-base" value={form.role ?? 'guest'} onChange={e => set('role', e.target.value)}>
          <option value="guest">👤 Convidado</option>
          <option value="vendor">🏢 Fornecedor</option>
          <option value="helper">🙋 Ajudante</option>
          <option value="other">📋 Outro</option>
        </select>
      </div>

      <Field
        label="Nome *"
        value={form.name ?? ''}
        onChange={v => set('name', v)}
        placeholder="Ex: Ana Souza, Buffet Estrela..."
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Telefone" type="tel" value={form.phone ?? ''} onChange={v => set('phone', v)} placeholder="(11) 99999-9999" />
        <Field label="E-mail" type="email" value={form.email ?? ''} onChange={v => set('email', v)} placeholder="email@exemplo.com" />
      </div>

      {!isVendor && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Confirmação (RSVP)</label>
            <select className="input-base" value={form.rsvp_status ?? 'pending'} onChange={e => set('rsvp_status', e.target.value)}>
              <option value="pending">⏳ Pendente</option>
              <option value="confirmed">✅ Confirmado</option>
              <option value="declined">❌ Recusou</option>
              <option value="maybe">🤔 Talvez</option>
            </select>
          </div>
          <Field
            label="Acompanhantes (total)"
            type="number"
            value={form.party_size != null ? String(form.party_size) : '1'}
            onChange={v => set('party_size', v ? parseInt(v) : 1)}
            placeholder="1"
          />
        </div>
      )}

      {isVendor && (
        <div>
          <label className="text-sm text-gray-600 block mb-1">Tipo de serviço</label>
          <select className="input-base" value={form.vendor_type ?? ''} onChange={e => set('vendor_type', e.target.value || null)}>
            <option value="">— Selecione —</option>
            {VENDOR_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Restrições alimentares, endereço, instruções..."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
