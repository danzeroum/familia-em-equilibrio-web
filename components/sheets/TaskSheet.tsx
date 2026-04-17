'use client'
import { useEffect, useState } from 'react'
import type { Task, Profile, ChecklistItem } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'
import { useCategoryStore } from '@/store/categoryStore'

interface Props {
  open: boolean
  onClose: () => void
  task: Task | null
  onSave: (t: any) => Promise<void>
  members: Profile[]
}

function newItem(text = ''): ChecklistItem {
  return { id: crypto.randomUUID(), text, done: false }
}

export function TaskSheet({ open, onClose, task, onSave, members }: Props) {
  const { categories, load: loadCategories } = useCategoryStore()
  const [form, setForm] = useState<Partial<Task & Record<string, any>>>({})
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [newText, setNewText] = useState('')

  useEffect(() => { loadCategories() }, [])

  useEffect(() => {
    const base = task ?? { priority: 'medium', status: 'pending', recurrence: 'none' }
    setForm(base)
    setChecklist(Array.isArray((base as any).checklist) ? (base as any).checklist : [])
    setNewText('')
  }, [task, open])

  const f = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  function addItem() {
    const text = newText.trim()
    if (!text) return
    setChecklist(prev => [...prev, newItem(text)])
    setNewText('')
  }

  function toggleItem(id: string) {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  function removeItem(id: string) {
    setChecklist(prev => prev.filter(i => i.id !== id))
  }

  function updateItemText(id: string, text: string) {
    setChecklist(prev => prev.map(i => i.id === id ? { ...i, text } : i))
  }

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    await onSave({ ...form, checklist })
    onClose()
  }

  if (!open) return null

  const groups = Array.from(new Set(categories.map(c => c.group_name))).sort()
  const done = checklist.filter(i => i.done).length

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

      {/* Prazo + Hora + Prioridade */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <Field label="Prazo" type="date" value={form.due_date ?? ''} onChange={v => f('due_date', v)} />
        <div>
          <label className="text-sm text-gray-600 block mb-1">Hora</label>
          <input
            type="time"
            className="input-base w-[110px]"
            value={form.due_time ?? ''}
            onChange={e => f('due_time', e.target.value || null)}
          />
        </div>
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

      {/* ───── CHECKLIST ───── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-gray-600 font-medium">
            ✅ Checklist
            {checklist.length > 0 && (
              <span className="ml-2 text-xs text-gray-400">{done}/{checklist.length}</span>
            )}
          </label>
          {checklist.length > 0 && done === checklist.length && (
            <span className="text-xs text-green-600 font-medium">Tudo feito! 🎉</span>
          )}
        </div>

        {checklist.length > 0 && (
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
            <div
              className="bg-teal-500 h-1.5 rounded-full transition-all"
              style={{ width: `${checklist.length ? (done / checklist.length) * 100 : 0}%` }}
            />
          </div>
        )}

        {checklist.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {checklist.map(item => (
              <li key={item.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleItem(item.id)}
                  className="w-4 h-4 accent-teal-600 shrink-0"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={e => updateItemText(item.id, e.target.value)}
                  className={`flex-1 text-sm bg-transparent border-b border-transparent focus:border-gray-300 outline-none py-0.5 ${
                    item.done ? 'line-through text-gray-400' : 'text-gray-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}
            placeholder="+ Adicionar item..."
            className="flex-1 input-base text-sm"
          />
          <button
            type="button"
            onClick={addItem}
            disabled={!newText.trim()}
            className="px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
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
