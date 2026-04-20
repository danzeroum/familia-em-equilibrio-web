'use client'
import { useEffect, useState } from 'react'
import type { Recipe } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'

interface Props {
  open: boolean
  onClose: () => void
  item: Recipe | null
  onSave: (b: Partial<Recipe>) => Promise<void>
}

export function RecipeSheet({ open, onClose, item, onSave }: Props) {
  const [form, setForm] = useState<Partial<Recipe>>({})
  const [tagsText, setTagsText] = useState('')

  useEffect(() => {
    setForm(item ?? { is_favorite: false, tags: [] })
    setTagsText((item?.tags ?? []).join(', '))
  }, [item, open])

  const set = (k: keyof Recipe, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean)
    await onSave({ ...form, tags })
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar receita' : 'Nova receita'} onClose={onClose}>

      <div className="grid grid-cols-[1fr_4fr] gap-3">
        <Field label="Emoji" value={form.emoji ?? ''} onChange={v => set('emoji', v)} placeholder="🍝" />
        <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} placeholder="Ex: Lasanha da vovó" />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Ingredientes</label>
        <textarea
          className="input-base resize-none"
          rows={5}
          value={form.ingredients ?? ''}
          onChange={e => set('ingredients', e.target.value)}
          placeholder={'500g de carne moída\n1 cebola\n2 tomates\n...'}
        />
      </div>

      <div>
        <label className="text-sm text-gray-600 block mb-1">Modo de preparo</label>
        <textarea
          className="input-base resize-none"
          rows={5}
          value={form.instructions ?? ''}
          onChange={e => set('instructions', e.target.value)}
          placeholder="1. Refogue a cebola..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Rende (porções)"
          type="number"
          value={form.servings != null ? String(form.servings) : ''}
          onChange={v => set('servings', v ? parseInt(v) : null)}
          placeholder="4"
        />
        <Field
          label="Tempo de preparo (min)"
          type="number"
          value={form.prep_minutes != null ? String(form.prep_minutes) : ''}
          onChange={v => set('prep_minutes', v ? parseInt(v) : null)}
          placeholder="45"
        />
      </div>

      <Field
        label="Tags (separadas por vírgula)"
        value={tagsText}
        onChange={v => setTagsText(v)}
        placeholder="Ex: massa, rápido, vegetariano"
      />

      <label className="flex items-center gap-2 cursor-pointer mt-1">
        <input
          type="checkbox"
          checked={!!form.is_favorite}
          onChange={e => set('is_favorite', e.target.checked)}
          className="accent-teal-600"
        />
        <span className="text-sm">⭐ Marcar como favorita</span>
      </label>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
