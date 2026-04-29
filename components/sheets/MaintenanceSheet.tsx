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
  { label: 'Mensal',           days: 30  },
  { label: 'A cada 2 meses',   days: 60  },
  { label: 'A cada 3 meses',   days: 90  },
  { label: 'A cada 6 meses',   days: 180 },
  { label: 'Anual',            days: 365 },
]

const CATEGORY_OPTIONS = [
  { value: 'geral',        label: '🏠 Geral'          },
  { value: 'seguranca',    label: '🔒 Segurança'       },
  { value: 'limpeza',      label: '🧹 Limpeza'         },
  { value: 'equipamentos', label: '❄️ Equipamentos'    },
  { value: 'hidraulica',   label: '💧 Hidráulica'      },
  { value: 'eletrica',     label: '🔌 Elétrica'        },
]

const EMOJI_OPTIONS = ['🔧','❄️','💧','🧯','🔥','🐛','🚿','🔌','🪟','🔒','🏠','⚡','🚰','🧹','🪣']

export function MaintenanceSheet({ open, onClose, item, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<HomeMaintenance> & {
    category?: string | null
    estimated_cost?: number | null
    provider_name?: string | null
    provider_phone?: string | null
  }>({})

  useEffect(() => {
    setForm(item
      ? { ...item }
      : { emoji: '🔧', frequency_label: 'Anual', frequency_days: 365, status: 'ok', category: 'geral' }
    )
  }, [item, open])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    await onSave(form)
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={item ? 'Editar manutenção' : 'Nova manutenção'} onClose={onClose}>

      {/* Emoji */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Emoji</label>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map(e => (
            <button key={e} type="button"
              className={`text-xl p-1 rounded border ${
                form.emoji === e ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
              }`}
              onClick={() => set('emoji', e)}>{e}</button>
          ))}
        </div>
      </div>

      {/* Título */}
      <Field label="Título *" value={form.title ?? ''} onChange={v => set('title', v)} placeholder="Ex: Limpeza do ar-condicionado" />

      {/* Categoria */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Categoria</label>
        <select className="input-base" value={form.category ?? 'geral'}
          onChange={e => set('category', e.target.value)}>
          {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Frequência */}
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

      {/* Responsável */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Responsável</label>
        <select className="input-base" value={form.responsible_id ?? ''}
          onChange={e => set('responsible_id', e.target.value || null)}>
          <option value="">— Nenhum —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.nickname ?? m.name}</option>)}
        </select>
      </div>

      {/* Última manutenção */}
      <Field label="Última manutenção" type="date" value={form.last_done_at ?? ''} onChange={v => set('last_done_at', v)} />

      {/* Custo estimado */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">💰 Custo estimado (R$)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Ex: 150.00"
          className="input-base"
          value={form.estimated_cost ?? ''}
          onChange={e => set('estimated_cost', e.target.value ? Number(e.target.value) : null)}
        />
      </div>

      {/* Prestador */}
      <Field
        label="📞 Prestador / Empresa"
        value={(form as any).provider_name ?? ''}
        onChange={v => set('provider_name', v)}
        placeholder="Ex: Clima Frio Refrigeração"
      />

      <Field
        label="📱 Telefone do prestador"
        value={(form as any).provider_phone ?? ''}
        onChange={v => set('provider_phone', v)}
        placeholder="Ex: (13) 99999-0000"
      />

      {/* Observações */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">📝 Observações</label>
        <textarea
          className="input-base resize-none"
          rows={3}
          placeholder="Informações adicionais, peças necessárias, etc."
          value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)}
        />
      </div>

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
