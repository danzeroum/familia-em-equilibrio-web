'use client'
import { useEffect, useState } from 'react'
import type { SocialEventTask, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: SocialEventTask | null
  eventId: string | null
  onSave: (i: Partial<SocialEventTask>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  members: Profile[]
}

export function SocialEventTaskSheet({ open, onClose, item, eventId, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<SocialEventTask>>({})

  useEffect(() => {
    setForm(item ?? { priority: 2, status: 'pending', event_id: eventId ?? undefined })
  }, [item, open, eventId])

  const set = (k: keyof SocialEventTask, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    if (!form.event_id) { alert('Selecione um evento'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar tarefa' : 'Nova tarefa'} onClose={onClose}>

      <Field
        label="Título *"
        value={form.title ?? ''}
        onChange={v => set('title', v)}
        placeholder="Ex: Reservar o buffet"
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo" type="date" value={form.due_date ?? ''} onChange={v => set('due_date', v || null)} />
        <Field label="Horário" type="time" value={form.due_time ?? ''} onChange={v => set('due_time', v || null)} />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select className="input-base" value={form.assigned_to ?? ''} onChange={e => set('assigned_to', e.target.value || null)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Prioridade</label>
        <select className="input-base" value={form.priority ?? 2} onChange={e => set('priority', parseInt(e.target.value))}>
          <option value={1}>🔴 Alta</option>
          <option value={2}>🟡 Média</option>
          <option value={3}>⚪ Baixa</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select className="input-base" value={form.status ?? 'pending'} onChange={e => set('status', e.target.value)}>
          <option value="pending">⏳ Pendente</option>
          <option value="done">✅ Feito</option>
        </select>
      </div>

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
