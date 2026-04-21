'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useMedications } from '@/hooks/useMedications'
import { useVaccines } from '@/hooks/useVaccines'
import { useHealthTracking } from '@/hooks/useHealthTracking'
import { useEmotionalPractices } from '@/hooks/useEmotionalPractices'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { MedicationSheet } from '@/components/sheets/MedicationSheet'
import { VaccineSheet } from '@/components/sheets/VaccineSheet'
import { HealthTrackingSheet } from '@/components/sheets/HealthTrackingSheet'
import { EmotionalPracticeSheet } from '@/components/sheets/EmotionalPracticeSheet'
import { AgendamentoSheet } from '@/components/sheets/AgendamentoSheet'
import { useQuickSchedule } from '@/hooks/useQuickSchedule'
import { formatDate } from '@/lib/utils'
import type { Medication, Vaccine } from '@/types/database'
import type { HealthTrackingItem } from '@/hooks/useHealthTracking'
import type { EmotionalPractice } from '@/hooks/useEmotionalPractices'

type Tab = 'medicamentos' | 'acompanhamento' | 'calculadora' | 'emocional'

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

function alertBadge(level: 'ok' | 'due_soon' | 'overdue', days: number | null) {
  if (level === 'overdue')  return { label: '🔴 Atrasado',  cls: 'bg-red-100 text-red-700'    }
  if (level === 'due_soon') return { label: days !== null ? `🟡 ${days}d` : '🟡 Pendente', cls: 'bg-yellow-100 text-yellow-700' }
  return { label: days !== null ? `🟢 ${days}d` : '🟢 OK', cls: 'bg-green-100 text-green-700' }
}

const STATUS_CYCLE: Record<string, { label: string; cls: string }> = {
  pending: { label: '⏳ Pendente', cls: 'bg-yellow-100 text-yellow-700' },
  done:    { label: '✅ Feito',    cls: 'bg-green-100 text-green-700'   },
  skipped: { label: '⏭️ Pulado',   cls: 'bg-gray-100 text-gray-500'     },
}

const EMPTY_NEW_MED = { name: '', dosePerKg: '', concMgMl: '' }

export default function SaudePage() {
  const { members } = useFamilyStore()
  const { medications, upsert: upsertMed, remove: removeMed } = useMedications()
  const { vaccines, upsert: upsertVac, remove: removeVac } = useVaccines()
  const health = useHealthTracking()
  const emotional = useEmotionalPractices()

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
    { id: 'medicamentos'   as Tab, label: '💊 Medicamentos',   alerts: alerts.length },
    { id: 'acompanhamento' as Tab, label: '🩺 Acompanhamento', alerts: healthAlerts  },
    { id: 'calculadora'    as Tab, label: '⚕️ Calculadora',     alerts: 0             },
    { id: 'emocional'      as Tab, label: '🧘 Saúde Emocional', alerts: 0             },
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

      {/* ══ ABA: ACOMPANHAMENTO DE SAÚDE ══ */}
      {tab === 'acompanhamento' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {health.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : health.items.length === 0 ? (
            <EmptyState
              emoji="🩺"
              title="Nenhum acompanhamento"
              description="Cadastre consultas, dentista e rotinas de saúde."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">🏷️ Item</th>
                    <th className="px-4 py-3 text-left">👤 Para</th>
                    <th className="px-4 py-3 text-left">🔁 Frequência</th>
                    <th className="px-4 py-3 text-left">👥 Responsável</th>
                    <th className="px-4 py-3 text-left">📅 Última vez</th>
                    <th className="px-4 py-3 text-left">📅 Próxima</th>
                    <th className="px-4 py-3 text-left">⏳ Dias</th>
                    <th className="px-4 py-3 text-left">🚦 Alerta</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {health.items.map(i => {
                    const badge = alertBadge(i.alertLevel, i.daysRemaining)
                    return (
                      <tr key={i.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{i.emoji} {i.title}</td>
                        <td className="px-4 py-3 text-gray-500">{getMemberName(i.profile_id)}</td>
                        <td className="px-4 py-3 text-gray-500">{i.frequency_label}</td>
                        <td className="px-4 py-3 text-gray-500">{getMemberName(i.responsible_id)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(i.last_done_at)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(i.next_due_at)}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {i.daysRemaining !== null ? (
                            <span className={i.daysRemaining < 0 ? 'text-red-600 font-semibold' : ''}>
                              {i.daysRemaining < 0 ? `${Math.abs(i.daysRemaining)}d atrás` : `${i.daysRemaining}d`}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button
                              className="text-xs text-gray-400 hover:text-gray-600"
                              onClick={() => { setSelectedHealth(i); setHealthOpen(true) }}>Editar</button>
                            <button
                              title="Criar agendamento"
                              onClick={() => schedule(`🏥 ${i.title}`, i.next_due_at)}
                              className="text-xs text-blue-400 hover:text-blue-600">📅</button>
                            <button
                              className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-1 rounded hover:bg-teal-100"
                              onClick={() => health.markDone(i.id)}>✓ Feito</button>
                            <button className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover?')) health.remove(i.id) }}>×</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ ABA: CALCULADORA PEDIÁTRICA ══ */}
      {tab === 'calculadora' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Doses calculadas automaticamente com base no peso de cada membro cadastrado.
            {members.every(m => !(m as any).weight_kg) && (
              <span className="text-yellow-600 ml-1">⚠️ Nenhum membro com peso cadastrado — atualize os perfis em <strong>Família</strong>.</span>
            )}
          </p>

          {/* Formulário inline para adicionar novo medicamento */}
          {showAddMed && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 space-y-3">
              <h3 className="font-semibold text-teal-800 text-sm">➕ Novo medicamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nome *</label>
                  <input
                    type="text"
                    placeholder="Ex: Amoxicilina"
                    value={newMed.name}
                    onChange={e => setNewMed(p => ({ ...p, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Dose (mg/kg) *</label>
                  <input
                    type="number"
                    placeholder="Ex: 25"
                    value={newMed.dosePerKg}
                    onChange={e => setNewMed(p => ({ ...p, dosePerKg: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Concentração (mg/ml) *</label>
                  <input
                    type="number"
                    placeholder="Ex: 250"
                    value={newMed.concMgMl}
                    onChange={e => setNewMed(p => ({ ...p, concMgMl: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
              {addMedError && <p className="text-xs text-red-600">{addMedError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleAddMed}
                  className="bg-teal-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-teal-700 transition-colors">
                  Adicionar
                </button>
                <button
                  onClick={() => { setShowAddMed(false); setNewMed(EMPTY_NEW_MED); setAddMedError('') }}
                  className="text-sm text-gray-500 px-4 py-1.5 rounded-lg border hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl border bg-white overflow-hidden">
            {pedMeds.length === 0 ? (
              <EmptyState emoji="⚕️" title="Nenhum medicamento" description="Adicione um medicamento para calcular a dose." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">💊 Medicamento</th>
                      <th className="px-4 py-3 text-left">Dose (mg/kg)</th>
                      <th className="px-4 py-3 text-left">Conc. (mg/ml)</th>
                      {members.map(m => (
                        <th key={m.id} className="px-4 py-3 text-left">
                          {(m as any).emoji ?? '👤'} {(m as any).nickname ?? (m as any).name}
                          {(m as any).weight_kg && (
                            <span className="block text-gray-400 font-normal normal-case">{(m as any).weight_kg} kg</span>
                          )}
                        </th>
                      ))}
                      <th className="px-4 py-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pedMeds.map(med => (
                      <tr key={med.id} className="hover:bg-gray-50 group">
                        <td className="px-4 py-3 font-medium text-gray-800">{med.name}</td>
                        <td className="px-4 py-3 text-gray-500">{med.dosePerKg} mg/kg</td>
                        <td className="px-4 py-3 text-gray-500">{med.concMgMl} mg/ml</td>
                        {members.map(m => {
                          const weight = (m as any).weight_kg ?? null
                          const result = weight ? calcMl(weight, med.dosePerKg, med.concMgMl) : '—'
                          return (
                            <td key={m.id} className="px-4 py-3">
                              {weight ? (
                                <span className="font-semibold text-teal-700">{result}</span>
                              ) : (
                                <span className="text-gray-400 text-xs">sem peso</span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveMed(med.id)}
                            className="text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">⚠️ Sempre confirme a dosagem com um profissional de saúde antes de administrar.</p>
        </div>
      )}

      {/* ══ ABA: SAÚDE EMOCIONAL ══ */}
      {tab === 'emocional' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Práticas de bem-estar emocional da família. Clique no status para alternar.</p>
            <span className="text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              ✅ {emotional.doneCount}/{emotional.total} esta semana
            </span>
          </div>
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">🧘 Prática</th>
                    <th className="px-4 py-3 text-left">📖 Como fazer</th>
                    <th className="px-4 py-3 text-left">⏰ Quando usar</th>
                    <th className="px-4 py-3 text-left">👨‍👩‍👧 Para quem</th>
                    <th className="px-4 py-3 text-left">🔁 Frequência</th>
                    <th className="px-4 py-3 text-left">📊 Status semana</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {emotional.practices.map(p => {
                    const st = STATUS_CYCLE[p.status]
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{p.emoji} {p.title}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[200px]">{p.howTo}</td>
                        <td className="px-4 py-3 text-gray-500">{p.whenToUse}</td>
                        <td className="px-4 py-3 text-gray-500">{p.forWhom}</td>
                        <td className="px-4 py-3 text-gray-500">{p.frequency}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => emotional.toggleStatus(p.id)}
                            className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${st.cls}`}
                          >{st.label}</button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-end">
                            <button
                              className="text-xs text-gray-400 hover:text-gray-600"
                              onClick={() => { setSelectedPractice(p); setEmotionalOpen(true) }}>Editar</button>
                            <button
                              className="text-xs text-red-400 hover:text-red-600"
                              onClick={() => { if (confirm('Remover prática?')) emotional.removePractice(p.id) }}>×</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-400">💡 O status é resetado a cada semana. Marque as práticas realizadas para acompanhar o progresso.</p>
        </div>
      )}

      <MedicationSheet open={medOpen} onClose={() => setMedOpen(false)} medication={selectedMed} onSave={upsertMed} members={members} />
      <VaccineSheet open={vacOpen} onClose={() => setVacOpen(false)} vaccine={selectedVac} onSave={upsertVac} members={members} />
      <HealthTrackingSheet open={healthOpen} onClose={() => setHealthOpen(false)} item={selectedHealth} onSave={health.upsert} members={members} />
      <EmotionalPracticeSheet open={emotionalOpen} onClose={() => setEmotionalOpen(false)} practice={selectedPractice} onSave={handleSavePractice} />

      <AgendamentoSheet
        open={schedOpen}
        onClose={() => setSchedOpen(false)}
        item={null}
        defaultKind="task"
        prefill={schedPrefill}
        onSaveTask={upsertTask}
        onSaveEvent={upsertEvent}
        familyId={schedFamilyId}
        members={schedMembers}
      />
    </div>
  )
}
