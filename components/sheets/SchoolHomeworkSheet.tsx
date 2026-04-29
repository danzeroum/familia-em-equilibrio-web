'use client'
import { useEffect, useState } from 'react'
import type { SchoolHomework, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: SchoolHomework | null
  onSave: (i: any) => Promise<void>
  members: Profile[]
}

const STATUS_OPTIONS: { value: SchoolHomework['status']; label: string }[] = [
  { value: 'pending',     label: '⏳ Pendente' },
  { value: 'in_progress', label: '🔄 Em andamento' },
  { value: 'done',        label: '✅ Concluído' },
]

export function SchoolHomeworkSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<SchoolHomework>>({})

  useEffect(() => {
    setForm(item ?? { status: 'pending', needs_help: false, is_project: false })
  }, [item, open])

  const set = (k: keyof SchoolHomework, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim())   { alert('Título é obrigatório'); return }
    if (!form.subject?.trim()) { alert('Disciplina é obrigatória'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar lição' : 'Nova lição / projeto'} onClose={onClose}>
      <div>
        <label className="text-sm text-gray-600 block mb-1">Criança</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value || null)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Disciplina *" value={form.subject ?? ''} onChange={v => set('subject', v)} placeholder="Ex: Matemática" />
        <Field label="Prazo" type="date" value={form.due_date ?? ''} onChange={v => set('due_date', v || null)} />
      </div>

      <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} placeholder="Ex: Exercícios pág. 42, projeto ciências..." />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Descrição</label>
        <textarea className="input-base resize-none" rows={3} placeholder="Instruções, materiais necessários..." value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select className="input-base" value={form.status ?? 'pending'} onChange={e => set('status', e.target.value as any)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-4 mt-2 p-3 border rounded bg-gray-50">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={!!form.is_project} onChange={e => set('is_project', e.target.checked)} className="w-4 h-4 accent-teal-600" />
          🎨 É projeto
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={!!form.needs_help} onChange={e => set('needs_help', e.target.checked)} className="w-4 h-4 accent-teal-600" />
          🆘 Precisa ajuda
        </label>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
