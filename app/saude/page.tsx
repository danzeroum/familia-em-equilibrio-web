'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useMedications } from '@/hooks/useMedications'
import { useVaccines } from '@/hooks/useVaccines'
import { useHealthTracking } from '@/hooks/useHealthTracking'
import { useEmotionalPractices } from '@/hooks/useEmotionalPractices'
import { usePharmacyItems, STATUS_CONFIG, PRIORITY_CONFIG } from '@/hooks/usePharmacyItems'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { MedicationSheet } from '@/components/sheets/MedicationSheet'
import { VaccineSheet } from '@/components/sheets/VaccineSheet'
import { HealthTrackingSheet } from '@/components/sheets/HealthTrackingSheet'
import { EmotionalPracticeSheet } from '@/components/sheets/EmotionalPracticeSheet'
import { PharmacyItemSheet } from '@/components/sheets/PharmacyItemSheet'
import { AgendamentoSheet } from '@/components/sheets/AgendamentoSheet'
import { useQuickSchedule } from '@/hooks/useQuickSchedule'
import { formatDate } from '@/lib/utils'
import type { Medication, Vaccine } from '@/types/database'
import type { HealthTrackingItem } from '@/hooks/useHealthTracking'
import type { EmotionalPractice } from '@/hooks/useEmotionalPractices'
import type { PharmacyItem } from '@/hooks/usePharmacyItems'

type Tab = 'medicamentos' | 'acompanhamento' | 'calculadora' | 'emocional' | 'farmacia'

type PedMed = { id: number; name: string; dosePerKg: number; concMgMl: number }

const DEFAULT_MEDS: PedMed[] = [
  { id: 1, name: 'Paracetamol', dosePerKg: 15, concMgMl: 200 },
  { id: 2, name: 'Ibuprofeno',  dosePerKg: 10, concMgMl: 50  },
  { id: 3, name: 'Dipirona',    dosePerKg: 15, concMgMl: 500 },
]

function calcMl(weightKg: number, dosePerKg: number, concMgMl: number): string {
  if (!weightKg || weightKg <= 0) return '—'
  const ml = (weightKg * dosePerKg) / concMgMl
  return `${ml.toFixed(1)} ml`
}

const EMPTY_NEW_MED = { name: '', dosePerKg: '', concMgMl: '' }

export default function SaudePage() {
  const { members } = useFamilyStore()
  const { medications, upsert: upsertMed, remove: removeMed } = useMedications()
  const { vaccines, upsert: upsertVac, remove: removeVac } = useVaccines()
  const health = useHealthTracking()
  const emotional = useEmotionalPractices()
  const pharmacy = usePharmacyItems()

  const [tab, setTab] = useState<Tab>('medicamentos')

  // Medication sheet
  const [medOpen, setMedOpen] = useState(false)
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null)

  // Vaccine sheet
  const [vacOpen, setVacOpen] = useState(false)
  const [selectedVac, setSelectedVac] = useState<Vaccine | null>(null)

  // Health tracking sheet
  const [healthOpen, setHealthOpen] = useState(false)
  const [selectedHealth, setSelectedHealth] = useState<HealthTrackingItem | null>(null)

  // Emotional practice sheet
  const [emotionalOpen, setEmotionalOpen] = useState(false)
  const [selectedPractice, setSelectedPractice] = useState<EmotionalPractice | null>(null)

  // Pharmacy sheet
  const [pharmacyOpen, setPharmacyOpen] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyItem | null>(null)

  const { schedule, schedOpen, setSchedOpen, schedPrefill, upsertTask, upsertEvent, schedFamilyId, schedMembers } = useQuickSchedule()

  // ── Calculadora: lista editável em memória ──
  const [pedMeds, setPedMeds] = useState<PedMed[]>(DEFAULT_MEDS)
  const [showAddMed, setShowAddMed] = useState(false)
  const [newMed, setNewMed] = useState(EMPTY_NEW_MED)
  const [addMedError, setAddMedError] = useState('')

  function handleAddMed() {
    if (!newMed.name.trim()) { setAddMedError('Informe o nome.'); return }
    const dose = parseFloat(newMed.dosePerKg)
    const conc = parseFloat(newMed.concMgMl)
    if (isNaN(dose) || dose <= 0) { setAddMedError('Dose inválida.'); return }
    if (isNaN(conc) || conc <= 0) { setAddMedError('Concentração inválida.'); return }
    setPedMeds(prev => [...prev, { id: Date.now(), name: newMed.name.trim(), dosePerKg: dose, concMgMl: conc }])
    setNewMed(EMPTY_NEW_MED)
    setAddMedError('')
    setShowAddMed(false)
  }

  function handleRemoveMed(id: number) {
    if (!confirm('Remover este medicamento da calculadora?')) return
    setPedMeds(prev => prev.filter(m => m.id !== id))
  }

  const alerts = medications.filter(m => m.statusLabel !== '✅ OK')
  const healthAlerts = health.items.filter(i => i.alertLevel !== 'ok').length

  const getMemberName = (id: string | null) => {
    if (!id) return 'Família'
    return members.find(m => m.id === id)?.nickname ?? members.find(m => m.id === id)?.name ?? '—'
  }

  const TABS = [
    { id: 'medicamentos'   as Tab, label: '💊 Medicamentos',   alerts: alerts.length         },
    { id: 'acompanhamento' as Tab, label: '🩺 Acompanhamento', alerts: healthAlerts           },
    { id: 'calculadora'    as Tab, label: '⚕️ Calculadora',     alerts: 0                     },
    { id: 'emocional'      as Tab, label: '🧘 Saúde Emocional', alerts: 0                     },
    { id: 'farmacia'       as Tab, label: '🛒 Farmácia',        alerts: pharmacy.pending.length },
  ]

  function handleSavePractice(data: Omit<EmotionalPractice, 'status' | 'lastDoneWeek'>) {
    if (selectedPractice) {
      emotional.updatePractice(data)
    } else {
      emotional.addPractice(data)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="🩺"
        title="Saúde"
        description="Medicamentos, vacinas, acompanhamento e bem-estar"
        action={
          tab === 'medicamentos' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedMed(null); setMedOpen(true) }}>+ Remédio</button>
          ) : tab === 'acompanhamento' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedHealth(null); setHealthOpen(true) }}>+ Item</button>
          ) : tab === 'emocional' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedPractice(null); setEmotionalOpen(true) }}>+ Prática</button>
          ) : tab === 'calculadora' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setShowAddMed(true); setAddMedError('') }}>+ Adicionar</button>
          ) : tab === 'farmacia' ? (
            <button className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedPharmacy(null); setPharmacyOpen(true) }}>+ Item</button>
          ) : null
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
            {t.alerts > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{t.alerts}</span>
            )}
          </button>
        ))}
      </div>

      {/* ══ ABA: MEDICAMENTOS ══ */}
      {tab === 'medicamentos' && (
        <div className="space-y-4">
          {alerts.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h2 className="font-semibold text-red-700 mb-2">🚨 Alertas ({alerts.length})</h2>
              <div className="flex flex-wrap gap-2">
                {alerts.map(a => (
                  <span key={a.id} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    {a.name} — {a.statusLabel}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold">💊 Caixa de remédios</h2>
              <button className="text-sm text-teal-600 font-medium hover:underline"
                onClick={() => { setSelectedMed(null); setMedOpen(true) }}>+ Adicionar</button>
            </div>
            {medications.length === 0 ? (
              <EmptyState emoji="💊" title="Nenhum medicamento" description="Cadastre os medicamentos da família." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Nome</th>
                      <th className="px-4 py-2 text-left">Membro</th>
                      <th className="px-4 py-2 text-left">Forma</th>
                      <th className="px-4 py-2 text-left">Estoque</th>
                      <th className="px-4 py-2 text-left">Validade</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {medications.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{m.name}</td>
                        <td className="px-4 py-2 text-gray-500">{getMemberName(m.profile_id)}</td>
                        <td className="px-4 py-2">{m.form ?? '—'}</td>
                        <td className="px-4 py-2">{m.stock_quantity}/{m.minimum_stock}</td>
                        <td className="px-4 py-2">{m.expiry_date ? formatDate(m.expiry_date) : '—'}</td>
                        <td className="px-4 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${m.statusColor}`}>{m.statusLabel}</span>
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            title="Criar agendamento"
                            onClick={() => schedule(`💊 Comprar: ${m.name}`)}
                            className="text-xs text-blue-400 hover:text-blue-600">📅</button>
                          <button className="text-xs text-gray-400 hover:text-gray-600"
                            onClick={() => { setSelectedMed(m); setMedOpen(true) }}>Editar</button>
                          <button className="text-xs text-red-400 hover:text-red-600"
                            onClick={() => removeMed(m.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold">💉 Vacinas</h2>
              <button className="text-sm text-teal-600 font-medium hover:underline"
                onClick={() => { setSelectedVac(null); setVacOpen(true) }}>+ Adicionar</button>
            </div>
            {vaccines.length === 0 ? (
              <EmptyState emoji="💉" title="Nenhuma vacina" description="Registre as vacinas da família." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Vacina</th>
                      <th className="px-4 py-2 text-left">Membro</th>
                      <th className="px-4 py-2 text-left">Aplicada</th>
                      <th className="px-4 py-2 text-left">Próxima dose</th>
                      <th className="px-4 py-2 text-left">Dias</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {vaccines.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{v.name}</td>
                        <td className="px-4 py-2 text-gray-500">{getMemberName(v.profile_id)}</td>
                        <td className="px-4 py-2">{v.applied_at ? formatDate(v.applied_at) : '—'}</td>
                        <td className="px-4 py-2">{v.next_due ? formatDate(v.next_due) : '—'}</td>
                        <td className="px-4 py-2">
                          <span className={`font-bold text-xs ${
                            v.daysLeft !== null && v.daysLeft < 0 ? 'text-red-600'
                            : v.daysLeft !== null && v.daysLeft <= 30 ? 'text-yellow-600'
                            : 'text-green-600'
                          }`}>
                            {v.daysLeft !== null ? (v.daysLeft < 0 ? `${Math.abs(v.daysLeft)}d atrás` : `${v.daysLeft}d`) : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2 flex gap-2">
                          <button
                            title="Criar agendamento"
                            onClick={() => schedule(`💉 Vacina: ${v.name}`, v.next_due)}
                            className="text-xs text-blue-400 hover:text-blue-600">📅</button>
                          <button className="text-xs text-gray-400 hover:text-gray-600"
                            onClick={() => { setSelectedVac(v); setVacOpen(true) }}>Editar</button>
                          <button className="text-xs text-red-400 hover:text-red-600"
                            onClick={() => removeVac(v.id)}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ABA: ACOMPANHAMENTO ══ */}
      {tab === 'acompanhamento' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold">🩺 Acompanhamentos de saúde</h2>
              <button className="text-sm text-teal-600 font-medium hover:underline"
                onClick={() => { setSelectedHealth(null); setHealthOpen(true) }}>+ Adicionar</button>
            </div>
            {health.items.length === 0 ? (
              <EmptyState emoji="🩺" title="Nenhum acompanhamento" description="Registre consultas, exames e procedimentos." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-left">Membro</th>
                      <th className="px-4 py-2 text-left">Última vez</th>
                      <th className="px-4 py-2 text-left">Próximo</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {health.items.map(h => {
                      const badge = h.alertLevel === 'overdue'
                        ? { label: '🔴 Atrasado', cls: 'bg-red-100 text-red-700' }
                        : h.alertLevel === 'due_soon'
                        ? { label: `🟡 ${h.daysUntilNext}d`, cls: 'bg-yellow-100 text-yellow-700' }
                        : { label: `🟢 ${h.daysUntilNext}d`, cls: 'bg-green-100 text-green-700' }
                      return (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{h.name}</td>
                          <td className="px-4 py-2 text-gray-500">{getMemberName(h.profile_id)}</td>
                          <td className="px-4 py-2">{h.last_done ? formatDate(h.last_done) : '—'}</td>
                          <td className="px-4 py-2">{h.next_due ? formatDate(h.next_due) : '—'}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="px-4 py-2 flex gap-2">
                            <button
                              title="Criar agendamento"
                              onClick={() => schedule(`🩺 ${h.name}`, h.next_due)}
                              className="text-xs text-blue-400 hover:text-blue-600">📅</button>
                            <button className="text-xs text-gray-400 hover:text-gray-600"
                              onClick={() => { setSelectedHealth(h); setHealthOpen(true) }}>Editar</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => health.remove(h.id)}>×</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ABA: CALCULADORA ══ */}
      {tab === 'calculadora' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h2 className="font-semibold">⚕️ Calculadora pediátrica de doses</h2>
              <p className="text-xs text-gray-500 mt-0.5">Informe o peso da criança para calcular a dose em ml</p>
            </div>
            <div className="p-4 space-y-4">
              {members.filter(m => (m as any).is_child && (m as any).weight_kg).map(child => (
                <div key={child.id} className="rounded-lg border p-3 space-y-2">
                  <div className="font-medium text-sm">
                    {(child as any).emoji} {(child as any).nickname ?? child.name}
                    <span className="ml-2 text-gray-400 font-normal">{(child as any).weight_kg} kg</span>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs">
                      <tr>
                        <th className="px-2 py-1 text-left">Medicamento</th>
                        <th className="px-2 py-1 text-left">Dose/kg</th>
                        <th className="px-2 py-1 text-left">Conc.</th>
                        <th className="px-2 py-1 text-left font-bold text-teal-700">Volume</th>
                        <th className="px-2 py-1"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {pedMeds.map(med => (
                        <tr key={med.id}>
                          <td className="px-2 py-1.5 font-medium">{med.name}</td>
                          <td className="px-2 py-1.5 text-gray-500">{med.dosePerKg} mg/kg</td>
                          <td className="px-2 py-1.5 text-gray-500">{med.concMgMl} mg/ml</td>
                          <td className="px-2 py-1.5 font-bold text-teal-700">
                            {calcMl((child as any).weight_kg, med.dosePerKg, med.concMgMl)}
                          </td>
                          <td className="px-2 py-1.5">
                            <button className="text-xs text-red-300 hover:text-red-500"
                              onClick={() => handleRemoveMed(med.id)}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {members.filter(m => (m as any).is_child && (m as any).weight_kg).length === 0 && (
                <EmptyState emoji="⚕️" title="Nenhuma criança com peso cadastrado"
                  description="Adicione o peso dos membros infantis nas configurações da família." />
              )}

              {showAddMed && (
                <div className="rounded-lg border border-dashed p-4 space-y-3">
                  <h3 className="text-sm font-medium">Novo medicamento</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Nome</label>
                      <input className="input-base text-sm" value={newMed.name}
                        onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ex: Amoxicilina" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Dose mg/kg</label>
                      <input className="input-base text-sm" type="number" value={newMed.dosePerKg}
                        onChange={e => setNewMed(p => ({ ...p, dosePerKg: e.target.value }))}
                        placeholder="Ex: 25" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Conc. mg/ml</label>
                      <input className="input-base text-sm" type="number" value={newMed.concMgMl}
                        onChange={e => setNewMed(p => ({ ...p, concMgMl: e.target.value }))}
                        placeholder="Ex: 250" />
                    </div>
                  </div>
                  {addMedError && <p className="text-xs text-red-600">{addMedError}</p>}
                  <div className="flex gap-2">
                    <button onClick={handleAddMed}
                      className="text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">Salvar</button>
                    <button onClick={() => { setShowAddMed(false); setAddMedError('') }}
                      className="text-sm border px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ ABA: SAÚDE EMOCIONAL ══ */}
      {tab === 'emocional' && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold">🧘 Práticas de saúde emocional</h2>
              <button className="text-sm text-teal-600 font-medium hover:underline"
                onClick={() => { setSelectedPractice(null); setEmotionalOpen(true) }}>+ Adicionar</button>
            </div>
            {emotional.practices.length === 0 ? (
              <EmptyState emoji="🧘" title="Nenhuma prática cadastrada"
                description="Registre práticas de bem-estar como meditação, exercícios, terapia..." />
            ) : (
              <div className="divide-y">
                {emotional.practices.map(p => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="text-xs text-gray-500">{getMemberName(p.profile_id)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => emotional.toggleWeekStatus(p.id, p.status)}
                        className={`text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                          p.status === 'done' ? 'bg-green-100 text-green-700'
                          : p.status === 'skipped' ? 'bg-gray-100 text-gray-500'
                          : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {p.status === 'done' ? '✅ Feito' : p.status === 'skipped' ? '⏭️ Pulado' : '⏳ Pendente'}
                      </button>
                      <button className="text-xs text-gray-400 hover:text-gray-600"
                        onClick={() => { setSelectedPractice(p); setEmotionalOpen(true) }}>Editar</button>
                      <button className="text-xs text-red-400 hover:text-red-600"
                        onClick={() => emotional.removePractice(p.id)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ABA: FARMÁCIA ══ */}
      {tab === 'farmacia' && (
        <div className="space-y-4">

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-white p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pharmacy.pending.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Pendentes</div>
            </div>
            <div className="rounded-xl border bg-white p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{pharmacy.bought.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Comprados</div>
            </div>
            <div className="rounded-xl border bg-white p-3 text-center">
              <div className="text-2xl font-bold text-gray-400">{pharmacy.items.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">Total</div>
            </div>
          </div>

          {/* Lista de itens */}
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold">🛒 Lista de farmácia</h2>
              <div className="flex items-center gap-3">
                {pharmacy.bought.length > 0 && (
                  <button
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    onClick={() => { if (confirm(`Limpar ${pharmacy.bought.length} item(s) comprado(s)?`)) pharmacy.clearBought() }}>
                    🗑️ Limpar comprados
                  </button>
                )}
                <button className="text-sm text-teal-600 font-medium hover:underline"
                  onClick={() => { setSelectedPharmacy(null); setPharmacyOpen(true) }}>+ Adicionar</button>
              </div>
            </div>

            {pharmacy.items.length === 0 ? (
              <EmptyState emoji="🛒" title="Lista vazia" description="Adicione itens para comprar na farmácia." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-2 text-left">Item</th>
                      <th className="px-4 py-2 text-left">Qtd</th>
                      <th className="px-4 py-2 text-left">Prioridade</th>
                      <th className="px-4 py-2 text-left">Responsável</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pharmacy.items.map(item => {
                      const statusCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending
                      const priorityCfg = item.priority ? PRIORITY_CONFIG[item.priority] : null
                      const isBought = item.status === 'bought'
                      return (
                        <tr key={item.id} className={`hover:bg-gray-50 ${isBought ? 'opacity-50' : ''}`}>
                          <td className={`px-4 py-2 font-medium ${isBought ? 'line-through text-gray-400' : ''}`}>
                            {item.name}
                            {item.notes && (
                              <div className="text-xs text-gray-400 font-normal truncate max-w-[180px]">{item.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : '—'}
                          </td>
                          <td className="px-4 py-2">
                            {priorityCfg
                              ? <span className={`text-xs font-medium ${priorityCfg.cls}`}>{priorityCfg.label}</span>
                              : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-4 py-2 text-gray-500">
                            {getMemberName(item.assigned_to)}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => pharmacy.cycleStatus(item.id, item.status)}
                              className={`text-xs px-2 py-0.5 rounded-full cursor-pointer transition-colors ${statusCfg.cls}`}>
                              {statusCfg.label}
                            </button>
                          </td>
                          <td className="px-4 py-2 flex gap-2">
                            <button className="text-xs text-gray-400 hover:text-gray-600"
                              onClick={() => { setSelectedPharmacy(item); setPharmacyOpen(true) }}>Editar</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => pharmacy.remove(item.id)}>×</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ SHEETS ══ */}
      <MedicationSheet
        open={medOpen}
        onClose={() => setMedOpen(false)}
        medication={selectedMed}
        onSave={upsertMed}
        members={members}
      />
      <VaccineSheet
        open={vacOpen}
        onClose={() => setVacOpen(false)}
        vaccine={selectedVac}
        onSave={upsertVac}
        members={members}
      />
      <HealthTrackingSheet
        open={healthOpen}
        onClose={() => setHealthOpen(false)}
        item={selectedHealth}
        onSave={health.upsert}
        members={members}
      />
      <EmotionalPracticeSheet
        open={emotionalOpen}
        onClose={() => setEmotionalOpen(false)}
        practice={selectedPractice}
        onSave={handleSavePractice}
        members={members}
      />
      <PharmacyItemSheet
        open={pharmacyOpen}
        onClose={() => setPharmacyOpen(false)}
        item={selectedPharmacy}
        onSave={pharmacy.upsert}
        members={members}
      />
      <AgendamentoSheet
        open={schedOpen}
        onClose={() => setSchedOpen(false)}
        prefill={schedPrefill}
        onSaveTask={upsertTask}
        onSaveEvent={upsertEvent}
        familyId={schedFamilyId}
        members={schedMembers}
      />
    </div>
  )
}
