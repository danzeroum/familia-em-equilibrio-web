'use client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'
import type { HealthTrackingItem } from '@/hooks/useHealthTracking'

interface Props {
  open: boolean
  onClose: () => void
  item: HealthTrackingItem | null
  onSave: (item: any) => Promise<void>
  members: Profile[]
}

const FREQUENCY_OPTIONS = [
  { label: 'Diário',          days: 1   },
  { label: 'Semanal',         days: 7   },
  { label: 'Quinzenal',       days: 15  },
  { label: 'Mensal',          days: 30  },
  { label: 'A cada 3 meses',  days: 90  },
  { label: 'A cada 6 meses',  days: 180 },
  { label: 'Anual',           days: 365 },
  { label: 'Após consulta',   days: 90  },
]

const CATEGORY_OPTIONS = ['consulta', 'vacina', 'rotina', 'exame', 'terapia', 'outro']

const EMOJIS = ['🩺','💊','💉','🦷','👁️','🫁','🧠','🩻','📋','🏃','🧘','🥗','🛌','📊','👶']

type FormState = Partial<HealthTrackingItem>

export function HealthTrackingSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<FormState>({})

  useEffect(() => {
    setForm(item ?? {
      emoji: '🩺',
      category: 'consulta',
      frequency_label: 'Anual',
      frequency_days: 365,
      status: 'pending',
    })
  }, [item, open])

  const set = (k: keyof HealthTrackingItem, v: any) => setForm(f => ({ ...f, [k]: v }))

  function handleFrequency(label: string) {
    const opt = FREQUENCY_OPTIONS.find(o => o.label === label)
    set('frequency_label', label)
    if (opt) set('frequency_days', opt.days)
  }

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    if (!form.frequency_days) { alert('Selecione uma frequência'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar acompanhamento' : 'Novo acompanhamento'} onClose={onClose}>

      {/* Emoji */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Ícone</label>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map(e => (
            <button
              key={e}
              type="button"
              onClick={() => set('emoji', e)}
              className={`text-xl w-9 h-9 rounded-lg border transition-colors ${
                form.emoji === e
                  ? 'border-teal-500 bg-teal-50'
                  : 'border-gray-200 hover:border-teal-300'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <Field
        label="Título *"
        value={form.title ?? ''}
        onChange={v => set('title', v)}
        placeholder="Ex: Consulta pediátrica, Dentista..."
      />

      {/* Categoria */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Categoria</label>
        <select
          className="input-base"
          value={form.category ?? 'consulta'}
          onChange={e => set('category', e.target.value)}
        >
          {CATEGORY_OPTIONS.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Membro */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Para quem</label>
        <select
          className="input-base"
          value={form.profile_id ?? ''}
          onChange={e => set('profile_id', e.target.value || null)}
        >
          <option value="">Família toda</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {(m as any).emoji ?? '👤'} {(m as any).nickname ?? (m as any).name}
            </option>
          ))}
        </select>
      </div>

      {/* Responsável */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select
          className="input-base"
          value={form.responsible_id ?? ''}
          onChange={e => set('responsible_id', e.target.value || null)}
        >
          <option value="">— Ninguém definido —</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>
              {(m as any).emoji ?? '👤'} {(m as any).nickname ?? (m as any).name}
            </option>
          ))}
        </select>
      </div>

      {/* Frequência */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Frequência *</label>
        <select
          className="input-base"
          value={form.frequency_label ?? 'Anual'}
          onChange={e => handleFrequency(e.target.value)}
        >
          {FREQUENCY_OPTIONS.map(o => (
            <option key={o.label} value={o.label}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Última vez */}
      <Field
        label="Última realização"
        type="date"
        value={form.last_done_at ?? ''}
        onChange={v => set('last_done_at', v || null)}
      />

      {/* Próxima data */}
      <Field
        label="Próxima data (opcional — calculado automaticamente se deixar vazio)"
        type="date"
        value={form.next_due_at ?? ''}
        onChange={v => set('next_due_at', v || null)}
      />

      {/* Observações */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Observações</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value || null)}
          placeholder="Anotações sobre este acompanhamento..."
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
