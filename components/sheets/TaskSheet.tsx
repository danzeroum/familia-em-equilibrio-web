'use client'
import { useEffect, useState } from 'react'
import type { Task, Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'
import { useCategoryStore } from '@/store/categoryStore'

interface Props {
  open: boolean
  onClose: () => void
  task: Task | null
  onSave: (t: any) => Promise<void>
  members: Profile[]
}

export function TaskSheet({ open, onClose, task, onSave, members }: Props) {
  const { categories, load: loadCategories } = useCategoryStore()
  const [form, setForm] = useState<Partial<Task & Record<string, any>>>({})

  useEffect(() => { loadCategories() }, [])

  useEffect(() => {
    setForm(task ?? { priority: 'medium', status: 'pending', recurrence: 'none' })
  }, [task, open])

  const f = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  // Grupos de categorias
  const groups = Array.from(new Set(categories.map(c => c.group_name))).sort()

  return (
    <SlideOver title={task ? 'Editar tarefa' : 'Nova tarefa'} onClose={onClose}>

      {/* Título */}
      <Field
        label="Título *"
        value={form.title ?? ''}
        onChange={v => f('title', v)}
        placeholder="Ex: Levar Maria ao dentista"
      />

      {/* Descrição */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Descrição</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Detalhes ou instruções adicionais..."
          value={form.description ?? ''}
          onChange={e => f('description', e.target.value)}
        />
      </div>

      {/* Categoria */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Categoria</label>
        <select
          className="input-base"
          value={form.category_id ?? ''}
          onChange={e => f('category_id', e.target.value)}
        >
          <option value="">— Sem categoria —</option>
          {groups.map(group => (
            <optgroup key={group} label={group}>
              {categories
                .filter(c => c.group_name === group)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Responsável */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select
          className="input-base"
          value={form.assigned_to ?? ''}
          onChange={e => f('assigned_to', e.target.value)}
        >
          <option value="">— Selecione —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>
          ))}
        </select>
      </div>

      {/* Prazo + Prioridade lado a lado */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prazo" type="date" value={form.due_date ?? ''} onChange={v => f('due_date', v)} />
        <div>
          <label className="text-sm text-gray-600 block mb-1">Prioridade</label>
          <select className="input-base" value={form.priority ?? 'medium'} onChange={e => f('priority', e.target.value)}>
            <option value="low">🟢 Baixa</option>
            <option value="medium">🟡 Média</option>
            <option value="high">🔴 Alta</option>
          </select>
        </div>
      </div>

      {/* Recorrência */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Recorrência</label>
        <select className="input-base" value={form.recurrence ?? 'none'} onChange={e => f('recurrence', e.target.value)}>
          <option value="none">Sem recorrência</option>
          <option value="daily">Diária</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensal</option>
        </select>
      </div>

      {/* Local */}
      <Field
        label="Local"
        value={form.location ?? ''}
        onChange={v => f('location', v)}
        placeholder="Ex: UBS Centro, Escola Estadual..."
      />

      {/* Observações */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          placeholder="Notas rápidas, lembretes..."
          value={form.notes ?? ''}
          onChange={e => f('notes', e.target.value)}
        />
      </div>

      {/* Validação adulto */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="adult-val"
          checked={!!form.requires_adult_validation}
          onChange={e => f('requires_adult_validation', e.target.checked)}
          className="w-4 h-4 accent-teal-600"
        />
        <label htmlFor="adult-val" className="text-sm text-gray-600">
          👤 Requer validação de adulto
        </label>
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
