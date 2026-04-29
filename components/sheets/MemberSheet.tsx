'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { Profile } from '@/types/database'

type Tab = 'identidade' | 'saude' | 'escola'

interface Props { open: boolean; onClose: () => void; member: Profile | null }

export function MemberSheet({ open, onClose, member }: Props) {
  const { reload } = useFamilyStore()
  const [form, setForm] = useState<Partial<Profile>>({})
  const [tab, setTab] = useState<Tab>('identidade')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)

  useEffect(() => {
    setForm(member ?? {})
    setTab('identidade')
  }, [member, open])

  const f = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  async function save() {
    if (!form.name?.trim()) { alert('Nome é obrigatório'); return }
    setSaving(true)
    const { family } = useFamilyStore.getState()

    if (form.id) {
      // Edição: atualiza pelo id existente
      const { id: _id, created_at: _cat, ...updateData } = form
      const { error } = await (supabase as any).from('profiles').update(updateData).eq('id', form.id)
      if (error) { console.error('[MemberSheet] UPDATE ERRO:', error); alert('Erro ao salvar: ' + error.message) }
    } else {
      // Criação: omite o id — banco gera UUID automaticamente via gen_random_uuid()
      const { id: _omit, ...rest } = form as any
      const { error } = await supabase.from('profiles').insert({ ...rest, family_id: family?.id })
      if (error) { console.error('[MemberSheet] INSERT ERRO:', error); alert('Erro ao criar: ' + error.message) }
    }

    await reload?.()
    setSaving(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
    onClose()
  }

  if (!open) return null

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'identidade', label: 'Identidade', icon: '🧑' },
    { key: 'saude',      label: 'Saúde',      icon: '🏥' },
    { key: 'escola',     label: 'Escola',     icon: '🏢' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{member ? 'Editar membro' : 'Novo membro'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Abas */}
        <div className="flex border-b">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-teal-600 text-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* ===== ABA IDENTIDADE ===== */}
          {tab === 'identidade' && (
            <>
              <Row label="Nome completo *">
                <input className="input-base" value={form.name ?? ''} onChange={e => f('name', e.target.value)} />
              </Row>
              <Row label="Apelido">
                <input className="input-base" value={form.nickname ?? ''} onChange={e => f('nickname', e.target.value)} />
              </Row>
              <Row label="Tipo">
                <select className="input-base" value={form.role ?? 'adult'} onChange={e => f('role', e.target.value)}>
                  <option value="adult">👤 Adulto</option>
                  <option value="child">👦 Criança</option>
                  <option value="pet">🐾 Pet</option>
                </select>
              </Row>
              <Row label="Gênero">
                <select className="input-base" value={form.gender ?? ''} onChange={e => f('gender', e.target.value)}>
                  <option value="">—</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                  <option value="nao_informar">Prefiro não informar</option>
                </select>
              </Row>
              <Row label="Data de nascimento">
                <input type="date" className="input-base" value={form.birth_date ?? ''} onChange={e => f('birth_date', e.target.value)} />
              </Row>
              {form.birth_date && (
                <Row label="Idade">
                  <span className="text-sm text-gray-700 py-2 block">
                    {Math.floor((Date.now() - new Date(form.birth_date).getTime()) / (1000*60*60*24*365.25))} anos
                  </span>
                </Row>
              )}
              <Row label="CPF">
                <input className="input-base" placeholder="000.000.000-00" value={form.cpf ?? ''} onChange={e => f('cpf', e.target.value)} />
              </Row>
              <Row label="RG / Certidão">
                <input className="input-base" value={form.rg ?? ''} onChange={e => f('rg', e.target.value)} />
              </Row>
              <Row label="Nº Passaporte">
                <input className="input-base" value={form.passport_number ?? ''} onChange={e => f('passport_number', e.target.value)} />
              </Row>
              <Row label="Vencimento Passaporte">
                <input type="date" className="input-base" value={form.passport_expiry ?? ''} onChange={e => f('passport_expiry', e.target.value)} />
              </Row>
              <Row label="Foto (URL ou emoji)">
                <input className="input-base" placeholder="https://... ou 👨" value={form.avatar_url ?? ''} onChange={e => f('avatar_url', e.target.value)} />
              </Row>
              <Row label="Cor">
                <div className="flex items-center gap-3">
                  <input type="color" value={form.color_hex ?? '#4A90D9'} onChange={e => f('color_hex', e.target.value)} className="h-10 w-16 rounded cursor-pointer border" />
                  <span className="text-sm text-gray-500">{form.color_hex ?? '#4A90D9'}</span>
                </div>
              </Row>
            </>
          )}

          {/* ===== ABA SAÚDE ===== */}
          {tab === 'saude' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Row label="Peso (kg)">
                  <input type="number" className="input-base" value={form.weight_kg ?? ''} onChange={e => f('weight_kg', parseFloat(e.target.value) || null)} />
                </Row>
                <Row label="Altura (cm)">
                  <input type="number" className="input-base" value={form.height_cm ?? ''} onChange={e => f('height_cm', parseFloat(e.target.value) || null)} />
                </Row>
              </div>
              <Row label="Tipo sanguíneo">
                <select className="input-base" value={form.blood_type ?? ''} onChange={e => f('blood_type', e.target.value)}>
                  <option value="">—</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t}>{t}</option>)}
                </select>
              </Row>
              <Row label="Alergias a remédios">
                <TagInput values={form.medication_allergies ?? []} onChange={v => f('medication_allergies', v)} placeholder="Ex: Dipirona (Enter para adicionar)" />
              </Row>
              <Row label="Alergias alimentares">
                <TagInput values={form.food_allergies ?? []} onChange={v => f('food_allergies', v)} placeholder="Ex: Glúten (Enter para adicionar)" />
              </Row>
              <Row label="Alergias ambientais">
                <TagInput values={form.environmental_allergies ?? []} onChange={v => f('environmental_allergies', v)} placeholder="Ex: Pólen (Enter para adicionar)" />
              </Row>
              <Row label="Restrições alimentares">
                <TagInput values={form.dietary_restrictions ?? []} onChange={v => f('dietary_restrictions', v)} placeholder="Ex: Vegetariano (Enter para adicionar)" />
              </Row>
              <Row label="Condição crônica">
                <input className="input-base" placeholder="Ex: Diabetes tipo 2" value={form.chronic_condition ?? ''} onChange={e => f('chronic_condition', e.target.value)} />
              </Row>
              <Row label="Remédio de uso contínuo">
                <input className="input-base" placeholder="Ex: Metformina 500mg" value={form.continuous_medication ?? ''} onChange={e => f('continuous_medication', e.target.value)} />
              </Row>
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Plano de Saúde</p>
                <Row label="Nome do plano">
                  <input className="input-base" value={form.health_plan_name ?? ''} onChange={e => f('health_plan_name', e.target.value)} />
                </Row>
                <Row label="Operadora">
                  <input className="input-base" value={form.health_plan_provider ?? ''} onChange={e => f('health_plan_provider', e.target.value)} />
                </Row>
                <Row label="Nº Carteirinha">
                  <input className="input-base" value={form.health_plan_number ?? ''} onChange={e => f('health_plan_number', e.target.value)} />
                </Row>
                <Row label="Plano ativo">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.health_plan_active ?? false} onChange={e => f('health_plan_active', e.target.checked)} className="w-4 h-4 accent-teal-600" />
                    <span className="text-sm text-gray-700">Sim</span>
                  </label>
                </Row>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Médico &amp; Consultas</p>
                <Row label="Médico de referência">
                  <input className="input-base" value={form.doctor_name ?? ''} onChange={e => f('doctor_name', e.target.value)} />
                </Row>
                <Row label="Telefone do médico">
                  <input className="input-base" value={form.doctor_phone ?? ''} onChange={e => f('doctor_phone', e.target.value)} />
                </Row>
                <Row label="Última consulta">
                  <input type="date" className="input-base" value={form.last_doctor_visit ?? ''} onChange={e => f('last_doctor_visit', e.target.value)} />
                </Row>
                <Row label="Próxima consulta">
                  <input type="date" className="input-base" value={form.next_doctor_visit ?? ''} onChange={e => f('next_doctor_visit', e.target.value)} />
                </Row>
                <Row label="Próxima vacina">
                  <input type="date" className="input-base" value={form.next_vaccine ?? ''} onChange={e => f('next_vaccine', e.target.value)} />
                </Row>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Dentista</p>
                <Row label="Dentista de referência">
                  <input className="input-base" value={form.dentist_name ?? ''} onChange={e => f('dentist_name', e.target.value)} />
                </Row>
                <Row label="Última consulta dental">
                  <input type="date" className="input-base" value={form.last_dental_visit ?? ''} onChange={e => f('last_dental_visit', e.target.value)} />
                </Row>
              </div>
            </>
          )}

          {/* ===== ABA ESCOLA / TRABALHO ===== */}
          {tab === 'escola' && (
            <>
              <Row label="Escola / Empresa">
                <input className="input-base" value={form.school_or_company ?? ''} onChange={e => f('school_or_company', e.target.value)} />
              </Row>
              <Row label="Turno / Horário">
                <input className="input-base" placeholder="Ex: Manhã / 07h–12h" value={form.school_shift ?? ''} onChange={e => f('school_shift', e.target.value)} />
              </Row>
              <Row label="Telefone da escola">
                <input className="input-base" value={form.school_phone ?? ''} onChange={e => f('school_phone', e.target.value)} />
              </Row>
              <Row label="Professor / Gestor">
                <input className="input-base" value={form.teacher_or_manager ?? ''} onChange={e => f('teacher_or_manager', e.target.value)} />
              </Row>
              <Row label="Ano / Série">
                <input className="input-base" placeholder="Ex: 3º ano EF" value={form.school_year ?? ''} onChange={e => f('school_year', e.target.value)} />
              </Row>
              <Row label="Atividade extracurricular">
                <input className="input-base" placeholder="Ex: Judô" value={form.extracurricular ?? ''} onChange={e => f('extracurricular', e.target.value)} />
              </Row>
              <Row label="Dia / Horário da atividade">
                <input className="input-base" placeholder="Ex: Terça e quinta, 18h" value={form.extracurricular_schedule ?? ''} onChange={e => f('extracurricular_schedule', e.target.value)} />
              </Row>
              <Row label="Transporte (como vai)">
                <input className="input-base" placeholder="Ex: Van escolar / próprio" value={form.transport_mode ?? ''} onChange={e => f('transport_mode', e.target.value)} />
              </Row>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 bg-teal-600 text-white rounded-lg py-2 font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Salvando...' : savedMsg ? '✓ Salvo!' : 'Salvar'}
          </button>
          <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar de linha
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  )
}

// Componente de tags (array de texto)
function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('')

  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-1">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2 py-1 rounded-full">
            {v}
            <button onClick={() => onChange(values.filter(x => x !== v))} className="hover:text-red-500">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          className="input-base flex-1"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <button onClick={add} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg">+</button>
      </div>
    </div>
  )
}
