'use client'
import { useEffect, useState } from 'react'
import type { MealPlan, Profile, Recipe } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: MealPlan | null
  onSave: (b: Partial<MealPlan>) => Promise<void>
  members: Profile[]
  recipes: Recipe[]
  defaults?: { day_of_week?: number; meal_type?: MealPlan['meal_type'] }
}

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
]

const MEALS = [
  { value: 'breakfast', label: '☕ Café da manhã' },
  { value: 'lunch',     label: '🍽️ Almoço' },
  { value: 'snack',     label: '🍪 Lanche' },
  { value: 'dinner',    label: '🌙 Jantar' },
]

export function MealPlanSheet({ open, onClose, item, onSave, members, recipes, defaults }: Props) {
  const [form, setForm] = useState<Partial<MealPlan>>({})
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setForm(item ?? {
      day_of_week: defaults?.day_of_week ?? 1,
      meal_type: defaults?.meal_type ?? 'lunch',
    })
    setNotes((item as any)?.notes ?? '')
  }, [item, open, defaults])

  const set = (k: keyof MealPlan, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    if (form.day_of_week == null) { alert('Selecione um dia'); return }
    if (!form.meal_type) { alert('Selecione a refeição'); return }
    await onSave({ ...form, ...(notes ? { notes } as any : {}) })
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar refeição' : 'Nova refeição'} onClose={onClose}>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Dia *</label>
          <select className="input-base" value={form.day_of_week ?? 1} onChange={e => set('day_of_week', parseInt(e.target.value))}>
            {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 block mb-1">Refeição *</label>
          <select className="input-base" value={form.meal_type ?? 'lunch'} onChange={e => set('meal_type', e.target.value)}>
            {MEALS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <Field
        label="O que vai ser? *"
        value={form.title ?? ''}
        onChange={v => set('title', v)}
        placeholder="Ex: Macarrão à bolonhesa, Salada de frutas..."
      />

      <div>
        <label className="text-sm text-gray-600 block mb-1">Para quem?</label>
        <select className="input-base" value={form.profile_id ?? ''} onChange={e => set('profile_id', e.target.value || null)}>
          <option value="">— Família —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      {recipes.length > 0 && (
        <div>
          <label className="text-sm text-gray-600 block mb-1">Receita relacionada</label>
          <select className="input-base" value={form.recipe_id ?? ''} onChange={e => set('recipe_id', e.target.value || null)}>
            <option value="">— Nenhuma —</option>
            {recipes.map(r => <option key={r.id} value={r.id}>{r.emoji ? `${r.emoji} ` : ''}{r.title}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notas, ingredientes especiais..."
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
