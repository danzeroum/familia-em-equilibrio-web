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
import { QuickAddList } from '@/components/food/QuickAddList'
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

  const [tab, setTab] = useState<Tab>('farmacia')

  const [medOpen, setMedOpen] = useState(false)
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null)

  const [vacOpen, setVacOpen] = useState(false)
  const [selectedVac, setSelectedVac] = useState<Vaccine | null>(null)

  const [healthOpen, setHealthOpen] = useState(false)
  const [selectedHealth, setSelectedHealth] = useState<HealthTrackingItem | null>(null)

  const [emotionalOpen, setEmotionalOpen] = useState(false)
  const [selectedPractice, setSelectedPractice] = useState<EmotionalPractice | null>(null)

  const [pharmacyOpen, setPharmacyOpen] = useState(false)
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyItem | null>(null)

  const { schedule, schedOpen, setSchedOpen, schedPrefill, upsertTask, upsertEvent, schedFamilyId, schedMembers } = useQuickSchedule()

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

  const handleBulkAddPharmacy = async (names: string[]) => {
    for (const name of names) {
      await pharmacy.upsert({
        name,
        status: 'pending',
        priority: null,
        quantity: null,
        unit: null,
        notes: null,
        assigned_to: null,
      } as Omit<PharmacyItem, 'id' | 'family_id' | 'created_at' | 'updated_at'>)
    }
  }

  const pharmacyPending   = pharmacy.items.filter(i => i.status === 'pending')
  const pharmacyBought    = pharmacy.items.filter(i => i.status === 'bought')
  const pharmacyCancelled = pharmacy.items.filter(i => i.status === 'cancelled')

  const TABS = [
    { id: 'farmacia'       as Tab, label: '🛒 Compras (Farmácia)', alerts: pharmacy.pending.length },
    { id: 'medicamentos'   as Tab, label: '💊 Medicamentos',        alerts: alerts.length          },
    { id: 'acompanhamento' as Tab, label: '🩺 Acompanhamento',      alerts: healthAlerts           },
    { id: 'calculadora'    as Tab, label: '⚕️ Calculadora',          alerts: 0                     },
    { id: 'emocional'      as Tab, label: '🧘 Saúde Emocional',     alerts: 0                     },
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
            <div className="flex items-center gap-3">
              {pharmacyBought.length > 0 && (
                <button
                  className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                  onClick={() => { if (confirm(`Limpar ${pharmacyBought.length} item(s) comprado(s)?`)) pharmacy.clearBought() }}>
                  🗑️ Limpar comprados
                </button>
              )}
              <button className="text-sm text-teal-600 font-medium hover:underline"
                onClick={() => { setSelectedPharmacy(null); setPharmacyOpen(true) }}>+ Item</button>
            </div>
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

      {/* ══ ABA: COMPRAS (FARMÁCIA) ══ */}
      {tab === 'farmacia' && (
        <div className="space-y-5">
          <QuickAddList
            onAdd={handleBulkAddPharmacy}
            placeholder="Digite ou cole a lista de farmácia..."
          />

          {pharmacy.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : pharmacy.items.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title="Lista vazia"
              description="Adicione itens no campo acima — cole uma lista ou digite um por vez."
            />
          ) : (
            <>
              {/* A Comprar */}
              {pharmacyPending.length > 0 && (
                <div>
                  <h3 className="text-gray-700 font-medium mb-3">A Comprar ({pharmacyPending.length})</h3>
                  <div className="space-y-2">
                    {pharmacyPending.map(item => {
                      const priorityCfg = item.priority ? PRIORITY_CONFIG[item.priority] : null
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-white border p-3 rounded hover:border-teal-300 transition-colors">
                          <label className="flex items-center gap-3 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-5 h-5 accent-teal-600"
                              onChange={() => pharmacy.cycleStatus(item.id, item.status)}
                            />
                            <div>
                              <p className="font-medium text-gray-800">{item.name}</p>
                              <p className="text-xs text-gray-500">
                                {item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : ''}
                                {item.quantity && (priorityCfg || item.notes) ? ' · ' : ''}
                                {priorityCfg ? priorityCfg.label : ''}
                                {priorityCfg && item.notes ? ' · ' : ''}
                                {item.notes ?? ''}
                              </p>
                            </div>
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setSelectedPharmacy(item); setPharmacyOpen(true) }}
                              className="text-gray-400 text-sm hover:text-gray-600">Editar</button>
                            <button
                              onClick={() => pharmacy.remove(item.id)}
                              className="text-red-400 text-sm hover:text-red-600">×</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Comprados */}
              {pharmacyBought.length > 0 && (
                <div className="opacity-70">
                  <h3 className="text-gray-500 font-medium mb-3 text-sm">✅ Comprados ({pharmacyBought.length})</h3>
                  <div className="space-y-1.5">
                    {pharmacyBought.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-2 rounded text-sm">
                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked
                            className="w-4 h-4 accent-teal-600"
                            onChange={() => pharmacy.cycleStatus(item.id, item.status)}
                          />
                          <span className="text-gray-400 line-through">{item.name}</span>
                          {item.quantity && (
                            <span className="text-xs text-gray-400">
                              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                            </span>
                          )}
                        </label>
                        <button
                          onClick={() => pharmacy.remove(item.id)}
                          className="text-red-300 text-sm hover:text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelados */}
              {pharmacyCancelled.length > 0 && (
                <div className="opacity-60">
                  <h3 className="text-gray-400 font-medium mb-3 text-sm">⏭️ Cancelados ({pharmacyCancelled.length})</h3>
                  <div className="space-y-1.5">
                    {pharmacyCancelled.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-2 rounded text-sm">
                        <label className="flex items-center gap-3 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-teal-600"
                            onChange={() => pharmacy.cycleStatus(item.id, item.status)}
                          />
                          <span className="text-gray-400 line-through">{item.name}</span>
                        </label>
                        <button
                          onClick={() => pharmacy.remove(item.id)}
                          className="text-red-300 text-sm hover:text-red-500">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

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
                        ? { label: h.daysRemaining !== null ? `🟡 ${h.daysRemaining}d` : '🟡 Pendente', cls: 'bg-yellow-100 text-yellow-700' }
                        : { label: h.daysRemaining !== null ? `🟢 ${h.daysRemaining}d` : '🟢 OK', cls: 'bg-green-100 text-green-700' }
                      return (
                        <tr key={h.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{h.emoji} {h.title}</td>
                          <td className="px-4 py-2 text-gray-500">{getMemberName(h.profile_id)}</td>
                          <td className="px-4 py-2">{h.last_done_at ? formatDate(h.last_done_at) : '—'}</td>
                          <td className="px-4 py-2">{h.next_due_at ? formatDate(h.next_due_at) : '—'}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                          </td>
                          <td className="px-4 py-2 flex gap-2">
                            <button
                              title="Marcar como feito"
                              onClick={() => health.markDone(h.id)}
                              className="text-xs text-green-400 hover:text-green-600">✓</button>
                            <button
                              title="Criar agendamento"
                              onClick={() => schedule(`🩺 ${h.title}`, h.next_due_at)}
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

      {/* ══ ABA: SAÚDDE EMOCIONAL ══ */}
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
                      <div className="font-medium text-sm truncate">{p.emoji} {p.title}</div>
                      <div className="text-xs text-gray-500">{p.forWhom} · {p.frequency}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => emotional.toggleStatus(p.id)}
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
        item={null}
        prefill={schedPrefill}
        onSaveTask={upsertTask}
        onSaveEvent={upsertEvent}
        familyId={schedFamilyId}
        members={schedMembers}
      />
    </div>
  )
}
