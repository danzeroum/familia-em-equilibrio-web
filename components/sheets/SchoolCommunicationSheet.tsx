'use client'
import { useEffect, useState } from 'react'
import type { SchoolCommunication, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: SchoolCommunication | null
  onSave: (i: any) => Promise<void>
  members: Profile[]
}

const TYPE_OPTIONS: { value: SchoolCommunication['type']; label: string }[] = [
  { value: 'whatsapp', label: '💬 WhatsApp' },
  { value: 'email',    label: '📧 E-mail' },
  { value: 'reuniao',  label: '🗓️ Reunião' },
  { value: 'telefone', label: '📞 Telefone' },
  { value: 'outro',    label: '📝 Outro' },
]

const STATUS_OPTIONS: { value: SchoolCommunication['status']; label: string }[] = [
  { value: 'pending',     label: '⏳ Pendente' },
  { value: 'in_progress', label: '🔄 Em andamento' },
  { value: 'done',        label: '✅ Resolvido' },
]

export function SchoolCommunicationSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<SchoolCommunication>>({})

  useEffect(() => {
    setForm(item ?? { type: 'whatsapp', status: 'pending' })
  }, [item, open])

  const set = (k: keyof SchoolCommunication, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar comunicação' : 'Nova comunicação escolar'} onClose={onClose}>
      <div>
        <label className="text-sm text-gray-600 block mb-1">Criança</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value || null)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Canal</label>
        <select className="input-base" value={form.type ?? 'whatsapp'} onChange={e => set('type', e.target.value as any)}>
          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <Field label="Assunto *" value={form.title ?? ''} onChange={v => set('title', v)} placeholder="Ex: Reunião de pais, e-mail professor Lucas..." />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Descrição</label>
        <textarea className="input-base resize-none" rows={3} placeholder="Detalhes, contatos, links..." value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
      </div>

      <Field label="Prazo" type="date" value={form.due_date ?? ''} onChange={v => set('due_date', v || null)} />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select className="input-base" value={form.status ?? 'pending'} onChange={e => set('status', e.target.value as any)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
