'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { Profile } from '@/types/database'

interface Props { open: boolean; onClose: () => void; member: Profile | null }

export function MemberSheet({ open, onClose, member }: Props) {
  const { reload } = useFamilyStore()
  const [form, setForm] = useState<Partial<Profile>>({})

  useEffect(() => { setForm(member ?? {}) }, [member])

  const set = (k: keyof Profile, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (form.id) {
      await supabase.from('profiles').update(form).eq('id', form.id)
    } else {
      await supabase.from('profiles').insert(form as any)
    }
    await reload?.()
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{member ? 'Editar membro' : 'Novo membro'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="space-y-4">
          <Field label="Nome completo *" value={form.name ?? ''} onChange={v => set('name', v)} />
          <Field label="Apelido" value={form.nickname ?? ''} onChange={v => set('nickname', v)} />
          <div>
            <label className="text-sm text-gray-600">Tipo</label>
            <select className="input-base" value={form.member_type ?? 'adult'} onChange={e => set('member_type', e.target.value)}>
              <option value="adult">👤 Adulto</option>
              <option value="child">👦 Criança</option>
              <option value="pet">🐾 Pet</option>
            </select>
          </div>
          <Field label="Data de nascimento" type="date" value={form.birthdate ?? ''} onChange={v => set('birthdate', v)} />
          <Field label="Peso (kg)" type="number" value={String(form.weight_kg ?? '')} onChange={v => set('weight_kg', parseFloat(v))} />
          <Field label="Altura (cm)" type="number" value={String(form.height_cm ?? '')} onChange={v => set('height_cm', parseFloat(v))} />
          <div>
            <label className="text-sm text-gray-600">Tipo sanguíneo</label>
            <select className="input-base" value={form.blood_type ?? ''} onChange={e => set('blood_type', e.target.value)}>
              <option value="">—</option>
              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <Field label="Escola / Trabalho" value={form.school ?? ''} onChange={v => set('school', v)} />
          <Field label="Plano de saúde" value={form.health_plan ?? ''} onChange={v => set('health_plan', v)} />
          <Field label="Passaporte" value={form.passport_number ?? ''} onChange={v => set('passport_number', v)} />
          <div>
            <label className="text-sm text-gray-600">Cor</label>
            <select className="input-base" value={form.color ?? 'blue'} onChange={e => set('color', e.target.value)}>
              {['blue','green','pink','yellow','purple','orange'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={save} className="flex-1 bg-teal-600 text-white rounded-lg py-2 font-medium hover:bg-teal-700">Salvar</button>
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-gray-600 hover:bg-gray-50">Cancelar</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="input-base" />
    </div>
  )
}
