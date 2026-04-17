'use client'
import { useEffect, useState } from 'react'
import type { HomeMaintenance, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: HomeMaintenance | null
  onSave: (i: any) => Promise<void>
  members: Profile[]
}

const FREQ_OPTIONS = [
  { label: 'Mensal', days: 30 },
  { label: 'A cada 2 meses', days: 60 },
  { label: 'A cada 3 meses', days: 90 },
  { label: 'A cada 6 meses', days: 180 },
  { label: 'Anual', days: 365 },
]

const EMOJI_OPTIONS = ['🔧','❄️','💧','🧯','🔥','🐛','🚿','🔌','🪟','🔒','🏠','⚡','🚰','🧹','🪣']

export function MaintenanceSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<HomeMaintenance>>({})

  useEffect(() => {
    setForm(item ?? { emoji: '🔧', frequency_label: 'Anual', frequency_days: 365, status: 'ok' })
  }, [item, open])

  const set = (k: keyof HomeMaintenance, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar manutenção' : 'Nova manutenção'} onClose={onClose}>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Emoji</label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map(e => (
            <button key={e} type="button"
              className={`text-xl p-1 rounded border ${form.emoji === e ? 'border-teal-500 bg-teal-50' : 'border-gray-200'}`}
              onClick={() => set('emoji', e)}>{e}</button>
          ))}
        </div>
      </div>

      <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} placeholder="Ex: Limpeza do ar-condicionado" />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Frequência</label>
        <select className="input-base" value={form.frequency_label ?? 'Anual'}
          onChange={e => {
            const opt = FREQ_OPTIONS.find(f => f.label === e.target.value)!
            set('frequency_label', opt.label)
            set('frequency_days', opt.days)
          }}>
          {FREQ_OPTIONS.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select className="input-base" value={form.responsible_id ?? ''} onChange={e => set('responsible_id', e.target.value || null as any)}>
          <option value="">— Nenhum —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <Field label="Última manutenção" type="date" value={form.last_done_at ?? ''} onChange={v => set('last_done_at', v)} />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea className="input-base resize-none" rows={2} placeholder="Profissional, contato, custo estimado..." value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
