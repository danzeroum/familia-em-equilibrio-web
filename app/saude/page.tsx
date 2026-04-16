'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useMedications } from '@/hooks/useMedications'
import { useVaccines } from '@/hooks/useVaccines'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { MedicationSheet } from '@/components/sheets/MedicationSheet'
import { VaccineSheet } from '@/components/sheets/VaccineSheet'
import { calcPediatricDose, formatDate } from '@/lib/utils'
import type { Medication, Vaccine } from '@/types/database'

export default function SaudePage() {
  const { members } = useFamilyStore()
  const { medications, upsert: upsertMed, remove: removeMed } = useMedications()
  const { vaccines, upsert: upsertVac, remove: removeVac } = useVaccines()

  const [medOpen, setMedOpen] = useState(false)
  const [selectedMed, setSelectedMed] = useState<Medication | null>(null)
  const [vacOpen, setVacOpen] = useState(false)
  const [selectedVac, setSelectedVac] = useState<Vaccine | null>(null)

  // Calculadora pediátrica
  const [calcWeight, setCalcWeight] = useState('')
  const [calcDose, setCalcDose] = useState('')
  const [calcConc, setCalcConc] = useState('')
  const calcResult = calcWeight && calcDose && calcConc
    ? calcPediatricDose(parseFloat(calcWeight), parseFloat(calcDose), parseFloat(calcConc))
    : null

  const alerts = medications.filter(m => m.statusLabel !== '✅ OK')

  return (
    <div className="space-y-6">
      <PageHeader title="🩺 Saúde" subtitle="Medicamentos, vacinas e calculadora" />

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-700 mb-2">🚨 Alertas de medicamento ({alerts.length})</h2>
          <div className="flex flex-wrap gap-2">
            {alerts.map(a => (
              <span key={a.id} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                {a.name} — {a.statusLabel}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calculadora pediátrica */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-3">💊 Calculadora pediátrica</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500">Peso (kg)</label>
            <input type="number" value={calcWeight} onChange={e => setCalcWeight(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm mt-1" placeholder="Ex: 15" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Dose (mg/kg)</label>
            <input type="number" value={calcDose} onChange={e => setCalcDose(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm mt-1" placeholder="Ex: 10" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Concentração (mg/ml)</label>
            <input type="number" value={calcConc} onChange={e => setCalcConc(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm mt-1" placeholder="Ex: 200" />
          </div>
        </div>
        {calcResult !== null && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
            <p className="text-sm text-teal-600">Dose calculada</p>
            <p className="text-2xl font-bold text-teal-700">{calcResult} ml</p>
          </div>
        )}
      </div>

      {/* Caixa de remédios */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">💊 Caixa de remédios</h2>
          <button className="text-sm text-teal-600 font-medium hover:underline" onClick={() => { setSelectedMed(null); setMedOpen(true) }}>+ Adicionar</button>
        </div>
        {medications.length === 0 ? (
          <EmptyState title="Nenhum medicamento" description="Cadastre os medicamentos da família." />
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
                    <td className="px-4 py-2 text-gray-500">{members.find(mb => mb.id === m.profile_id)?.nickname ?? '—'}</td>
                    <td className="px-4 py-2">{m.form ?? '—'}</td>
                    <td className="px-4 py-2">{m.stock_quantity}/{m.minimum_stock}</td>
                    <td className="px-4 py-2">{m.expiry_date ? formatDate(m.expiry_date) : '—'}</td>
                    <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${m.statusColor}`}>{m.statusLabel}</span></td>
                    <td className="px-4 py-2 flex gap-2">
                      <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setSelectedMed(m); setMedOpen(true) }}>Editar</button>
                      <button className="text-xs text-red-400 hover:text-red-600" onClick={() => removeMed(m.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vacinas */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">💉 Vacinas</h2>
          <button className="text-sm text-teal-600 font-medium hover:underline" onClick={() => { setSelectedVac(null); setVacOpen(true) }}>+ Adicionar</button>
        </div>
        {vaccines.length === 0 ? (
          <EmptyState title="Nenhuma vacina" description="Registre as vacinas da família." />
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
                    <td className="px-4 py-2 text-gray-500">{members.find(m => m.id === v.profile_id)?.nickname ?? '—'}</td>
                    <td className="px-4 py-2">{v.applied_date ? formatDate(v.applied_date) : '—'}</td>
                    <td className="px-4 py-2">{v.next_due ? formatDate(v.next_due) : '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`font-bold text-xs ${v.daysLeft !== null && v.daysLeft < 0 ? 'text-red-600' : v.daysLeft !== null && v.daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {v.daysLeft !== null ? (v.daysLeft < 0 ? `${Math.abs(v.daysLeft)}d atrás` : `${v.daysLeft}d`) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setSelectedVac(v); setVacOpen(true) }}>Editar</button>
                      <button className="text-xs text-red-400 hover:text-red-600" onClick={() => removeVac(v.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MedicationSheet open={medOpen} onClose={() => setMedOpen(false)} medication={selectedMed} onSave={upsertMed} members={members} />
      <VaccineSheet open={vacOpen} onClose={() => setVacOpen(false)} vaccine={selectedVac} onSave={upsertVac} members={members} />
    </div>
  )
}
