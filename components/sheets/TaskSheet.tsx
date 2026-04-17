'use client'
import { useEffect, useState } from 'react'
import type { Task, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  task: Task | null
  onSave: (t: any) => Promise<void>
  members: Profile[]
}

export function TaskSheet({ open, onClose, task, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<Task>>({})

  useEffect(() => {
    setForm(task ?? { priority: 'medium', status: 'pending', recurrence: 'none' })
  }, [task, open])

  const set = (k: keyof Task, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={task ? 'Editar tarefa' : 'Nova tarefa'} onClose={onClose}>
      <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} placeholder="Ex: Levar Maria ao dentista" />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select
          className="input-base"
          value={form.assigned_to ?? ''}
          onChange={e => set('assigned_to', e.target.value)}
        >
          <option value="">— Selecione —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>
          ))}
        </select>
      </div>

      <Field label="Prazo" type="date" value={form.due_date ?? ''} onChange={v => set('due_date', v)} />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Prioridade</label>
        <select className="input-base" value={form.priority ?? 'medium'} onChange={e => set('priority', e.target.value)}>
          <option value="low">🟢 Baixa</option>
          <option value="medium">🟡 Média</option>
          <option value="high">🔴 Alta</option>
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Recorrência</label>
        <select className="input-base" value={form.recurrence ?? 'none'} onChange={e => set('recurrence', e.target.value)}>
          <option value="none">Sem recorrência</option>
          <option value="daily">Diária</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="adult-val"
          checked={!!form.requires_adult_validation}
          onChange={e => set('requires_adult_validation', e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <label htmlFor="adult-val" className="text-sm text-gray-600">👤 Requer validação de adulto</label>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
