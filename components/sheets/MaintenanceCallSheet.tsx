'use client'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types/database'
import { SlideOver, Field, SaveCancel } from './_shared'
import type { MaintenanceCall } from '@/hooks/useMaintenanceCalls'

interface Props {
  open: boolean
  onClose: () => void
  call: MaintenanceCall | null
  onSave: (c: Partial<MaintenanceCall> & { title: string }) => Promise<void>
  members: Profile[]
}

const PRIORITY_OPTIONS = [
  { value: 1, label: '🔴 Crítico — resolver logo' },
  { value: 2, label: '🟡 Importante — em breve' },
  { value: 3, label: '⚪ Quando puder' },
]

const STATUS_OPTIONS = [
  { value: 'pending',   label: '⏳ Pendente (sem data)' },
  { value: 'scheduled', label: '📅 Agendado' },
  { value: 'done',      label: '✅ Resolvido' },
]

export function MaintenanceCallSheet({ open, onClose, call, onSave, members }: Props) {
  const [form, setForm] = useState<Partial<MaintenanceCall>>({})

  useEffect(() => {
    setForm(call ?? { status: 'pending', priority: 2 })
  }, [call, open])

  const set = (k: keyof MaintenanceCall, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.title?.trim()) { alert('Título é obrigatório'); return }
    // Se status é pending, limpa scheduled_date para evitar confusão
    const payload = {
      ...form,
      scheduled_date: form.status === 'pending' ? null : (form.scheduled_date ?? null),
    }
    await onSave(payload as Partial<MaintenanceCall> & { title: string })
    onClose()
  }

  if (!open) return null

  return (
    <SlideOver title={call ? 'Editar conserto' : 'Registrar conserto'} onClose={onClose}>

      <Field
        label="Problema *"
        value={form.title ?? ''}
        onChange={v => set('title', v)}
        placeholder="Ex: Torneira pingando, porta travada..."
      />

      <Field
        label="Descrição"
        value={form.description ?? ''}
        onChange={v => set('description', v)}
        placeholder="Detalhes do problema, cômodo afetado..."
      />

      {/* Prioridade */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Urgência</label>
        <div className="flex flex-col gap-1.5">
          {PRIORITY_OPTIONS.map(o => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="priority"
                value={o.value}
                checked={(form.priority ?? 2) === o.value}
                onChange={() => set('priority', o.value)}
                className="accent-teal-600"
              />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="text-sm text-gray-600 block mb-1">Status</label>
        <select
          className="input-base"
          value={form.status ?? 'pending'}
          onChange={e => set('status', e.target.value)}
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Data agendada — só aparece se status é scheduled */}
      {form.status === 'scheduled' && (
        <Field
          label="Data agendada"
          type="date"
          value={form.scheduled_date ?? ''}
          onChange={v => set('scheduled_date', v || null)}
        />
      )}

      {/* Profissional */}
      <Field
        label="Profissional / Empresa"
        value={form.professional_name ?? ''}
        onChange={v => set('professional_name', v)}
        placeholder="Ex: Hidráulica do Seu João"
      />

      <Field
        label="Telefone"
        value={form.professional_phone ?? ''}
        onChange={v => set('professional_phone', v)}
        placeholder="(11) 99999-9999"
      />

      <Field
        label="Custo estimado (R$)"
        type="number"
        value={form.estimated_cost != null ? String(form.estimated_cost) : ''}
        onChange={v => set('estimated_cost', v ? parseFloat(v) : null)}
        placeholder="0,00"
      />

      <SaveCancel onSave={save} onClose={onClose} />
    </SlideOver>
  )
}
