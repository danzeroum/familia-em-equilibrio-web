'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useBills } from '@/hooks/useBills'
import { useFamilyEvents } from '@/hooks/useFamilyEvents'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { BillSheet } from '@/components/sheets/BillSheet'
import { EventSheet } from '@/components/sheets/EventSheet'
import { formatDate } from '@/lib/utils'
import type { Bill, FamilyEvent } from '@/types/database'

const METHOD_LABEL: Record<string, string> = {
  credit_card: '💳 Crédito', debit_card: '💳 Débito', pix: '📱 Pix',
  bank_slip: '🏦 Boleto', auto_debit: '🔄 Débito auto', cash: '💵 Dinheiro',
}

export default function AgendaPage() {
  const { currentFamily } = useFamilyStore()
  const { bills, totalMonthly, updateStatus, upsert: upsertBill, remove: removeBill } = useBills()
  const { events, upsert: upsertEvent, toggleDone, remove: removeEvent } = useFamilyEvents(currentFamily?.id ?? null)

  const [billOpen, setBillOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [eventOpen, setEventOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null)
  const [monthlyIncome, setMonthlyIncome] = useState(0)

  const paidTotal = bills.filter(b => b.status === 'paid' || b.status === 'auto_debit').reduce((s, b) => s + (b.amount ?? 0), 0)
  const pendingTotal = bills.filter(b => b.status === 'pending').reduce((s, b) => s + (b.amount ?? 0), 0)
  const balance = monthlyIncome - totalMonthly

  return (
    <div className="space-y-6">
      <PageHeader title="💰 Agenda" subtitle="Contas, eventos e prazos" />

      {/* Resumo financeiro */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Renda mensal</p>
          <input type="number" value={monthlyIncome || ''} onChange={e => setMonthlyIncome(Number(e.target.value))}
            className="text-xl font-bold w-full outline-none" placeholder="R$ 0,00" />
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Total contas</p>
          <p className="text-xl font-bold text-red-600">R$ {totalMonthly.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Já pago</p>
          <p className="text-xl font-bold text-green-600">R$ {paidTotal.toFixed(2)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500 mb-1">Saldo estimado</p>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>R$ {balance.toFixed(2)}</p>
        </div>
      </div>

      {/* Contas recorrentes */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">📋 Contas do mês</h2>
          <button className="text-sm text-teal-600 font-medium hover:underline" onClick={() => { setSelectedBill(null); setBillOpen(true) }}>+ Adicionar</button>
        </div>
        {bills.length === 0 ? (
          <EmptyState title="Nenhuma conta" description="Cadastre as contas fixas e variáveis do mês." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Conta</th>
                  <th className="px-4 py-2 text-left">Valor</th>
                  <th className="px-4 py-2 text-left">Dia</th>
                  <th className="px-4 py-2 text-left">Método</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bills.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{b.title}</td>
                    <td className="px-4 py-2">R$ {(b.amount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-2">{b.due_day ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{METHOD_LABEL[b.payment_method ?? ''] ?? b.payment_method ?? '—'}</td>
                    <td className="px-4 py-2">
                      <select
                        value={b.status ?? 'pending'}
                        onChange={e => updateStatus(b.id, e.target.value as Bill['status'])}
                        className={`text-xs border rounded px-1 py-0.5 ${b.status === 'paid' ? 'bg-green-100 text-green-700' : b.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}
                      >
                        <option value="pending">⏳ Pendente</option>
                        <option value="paid">✅ Pago</option>
                        <option value="auto_debit">🔄 Débito auto</option>
                        <option value="overdue">🔴 Atrasado</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setSelectedBill(b); setBillOpen(true) }}>Editar</button>
                      <button className="text-xs text-red-400 hover:text-red-600" onClick={() => removeBill(b.id)}>×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Eventos e prazos */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">📅 Eventos e prazos</h2>
          <button className="text-sm text-teal-600 font-medium hover:underline" onClick={() => { setSelectedEvent(null); setEventOpen(true) }}>+ Adicionar</button>
        </div>
        {events.length === 0 ? (
          <EmptyState title="Nenhum evento" description="Cadastre datas importantes, viagens, consultas e aniversários." />
        ) : (
          <ul className="divide-y">
            {events.map(e => (
              <li key={e.id} className={`px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${e.is_done ? 'opacity-50' : ''}`}>
                <input type="checkbox" checked={!!e.is_done} onChange={() => toggleDone(e.id, !!e.is_done)} className="w-4 h-4 accent-teal-600" />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${e.is_done ? 'line-through text-gray-400' : ''}`}>{e.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(e.event_date)} · {e.daysLeft !== null ? (e.daysLeft < 0 ? `${Math.abs(e.daysLeft)}d atrás` : `em ${e.daysLeft}d`) : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setSelectedEvent(e); setEventOpen(true) }}>Editar</button>
                  <button className="text-xs text-red-400 hover:text-red-600" onClick={() => removeEvent(e.id)}>×</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <BillSheet open={billOpen} onClose={() => setBillOpen(false)} bill={selectedBill} onSave={upsertBill} />
      <EventSheet open={eventOpen} onClose={() => setEventOpen(false)} event={selectedEvent} onSave={upsertEvent} familyId={currentFamily?.id ?? ''} />
    </div>
  )
}
