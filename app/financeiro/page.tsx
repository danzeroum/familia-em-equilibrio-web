'use client'

import { useState } from 'react'
import { useBills, getBillUrgency, URGENCY_CONFIG, getBillsByCategory } from '@/hooks/useBills'
import { useSavingsGoals } from '@/hooks/useSavingsGoals'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { BillSheet } from '@/components/sheets/BillSheet'
import { SavingsGoalSheet } from '@/components/sheets/SavingsGoalSheet'
import type { Bill, SavingsGoal } from '@/types/database'

const CATEGORY_COLORS: Record<string, string> = {
  Moradia:      '#01696f',
  Alimentação:  '#437a22',
  Saúde:        '#a12c7b',
  Transporte:   '#006494',
  Educação:     '#7a39bb',
  Lazer:        '#da7101',
  Serviços:     '#d19900',
  Outros:       '#7a7974',
  fixed:        '#01696f',
  variable:     '#da7101',
  emergency:    '#a12c7b',
  savings:      '#437a22',
}

const CATEGORY_LABEL: Record<string, string> = {
  fixed: 'Fixo', variable: 'Variável', emergency: 'Emergência', savings: 'Poupança',
}

const METHOD_LABEL: Record<string, string> = {
  credit_card: '💳 Crédito',
  debit_card:  '💳 Débito',
  pix:         '📱 Pix',
  bank_slip:   '🏦 Boleto',
  auto_debit:  '🔄 Débito auto',
  cash:        '💵 Dinheiro',
}

const CURRENCY_FLAG: Record<string, string> = {
  BRL: 'R$', GBP: '£', USD: '$', EUR: '€',
}

function formatCurrency(value: number, currency = 'BRL') {
  return `${CURRENCY_FLAG[currency] ?? currency} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function CategoryChart({ bills }: { bills: Bill[] }) {
  const data = getBillsByCategory(bills)
  const total = data.reduce((s, d) => s + d.total, 0)
  if (total === 0) return null

  // Build SVG donut
  const SIZE = 120
  const R = 44
  const STROKE = 18
  const circumference = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="text-sm font-semibold mb-3">📊 Por categoria</h3>
      <div className="flex items-center gap-6">
        {/* Donut SVG */}
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#f3f0ec" strokeWidth={STROKE} />
          {data.map((d, i) => {
            const pct = d.total / total
            const dash = pct * circumference
            const gap = circumference - dash
            const currentOffset = offset
            offset += dash
            const color = CATEGORY_COLORS[d.category] ?? '#7a7974'
            return (
              <circle
                key={d.category}
                cx={SIZE/2} cy={SIZE/2} r={R}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={circumference / 4 - currentOffset}
                style={{ transition: 'stroke-dasharray 0.4s ease' }}
              />
            )
          })}
          <text x={SIZE/2} y={SIZE/2 - 6} textAnchor="middle" fontSize="10" fill="#7a7974">Total</text>
          <text x={SIZE/2} y={SIZE/2 + 8} textAnchor="middle" fontSize="11" fontWeight="600" fill="#28251d">
            {total >= 1000 ? `R$${(total/1000).toFixed(1)}k` : `R$${total.toFixed(0)}`}
          </text>
        </svg>
        {/* Legenda */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {data.map(d => {
            const pct = ((d.total / total) * 100).toFixed(0)
            const color = CATEGORY_COLORS[d.category] ?? '#7a7974'
            const label = CATEGORY_LABEL[d.category] ?? d.category
            return (
              <div key={d.category} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-gray-600 truncate flex-1">{label}</span>
                <span className="font-medium tabular-nums">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SavingsGoalCard({
  goal,
  onDeposit,
  onEdit,
  onDelete,
}: {
  goal: SavingsGoal
  onDeposit: (id: string, amount: number) => void
  onEdit: (goal: SavingsGoal) => void
  onDelete: (id: string) => void
}) {
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  const remaining = goal.target_amount - goal.current_amount
  const currency = goal.currency ?? 'BRL'

  const deadlineDays = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className={`rounded-xl border bg-white p-4 ${
      goal.is_completed ? 'border-green-200 bg-green-50' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{goal.icon ?? '🎯'}</span>
          <div>
            <p className="font-semibold text-sm leading-tight">{goal.title}</p>
            {goal.description && (
              <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(goal)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✏️</button>
          <button onClick={() => onDelete(goal.id)} className="text-xs text-gray-400 hover:text-red-500 px-1">×</button>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium" style={{ color: goal.color_hex ?? '#01696f' }}>
            {formatCurrency(goal.current_amount, currency)}
          </span>
          <span className="text-gray-400">{formatCurrency(goal.target_amount, currency)}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: goal.color_hex ?? '#01696f' }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">{pct.toFixed(0)}% guardado</span>
          {goal.is_completed ? (
            <span className="text-green-600 font-medium">✅ Concluído!</span>
          ) : (
            <span className="text-gray-400">Faltam {formatCurrency(remaining, currency)}</span>
          )}
        </div>
      </div>

      {/* Prazo */}
      {deadlineDays !== null && !goal.is_completed && (
        <p className={`text-xs mb-3 ${
          deadlineDays < 0 ? 'text-red-500' : deadlineDays <= 30 ? 'text-yellow-600' : 'text-gray-400'
        }`}>
          {deadlineDays < 0
            ? `⚠️ Prazo vencido há ${Math.abs(deadlineDays)} dias`
            : `📅 ${deadlineDays} dias restantes`}
        </p>
      )}

      {/* Depositar */}
      {!goal.is_completed && (
        <div>
          {depositOpen ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={depositValue}
                onChange={e => setDepositValue(e.target.value)}
                placeholder="Valor a adicionar"
                className="flex-1 text-sm border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
              />
              <button
                onClick={() => {
                  if (depositValue) {
                    onDeposit(goal.id, Number(depositValue))
                    setDepositValue('')
                    setDepositOpen(false)
                  }
                }}
                className="text-sm bg-teal-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-teal-700"
              >
                +
              </button>
              <button
                onClick={() => setDepositOpen(false)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDepositOpen(true)}
              className="w-full text-xs text-center py-1.5 rounded-lg border border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 transition-colors"
            >
              + Registrar depósito
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function FinanceiroPage() {
  const {
    bills, totalMonthly, paidTotal, pendingTotal,
    monthlyBudget, isSavingBudget,
    updateStatus, upsert: upsertBill, remove: removeBill,
    saveMonthlyBudget,
  } = useBills()

  const {
    goals, totalSaved, totalTarget,
    upsert: upsertGoal, addDeposit, remove: removeGoal,
  } = useSavingsGoals()

  const [billOpen, setBillOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [budgetInput, setBudgetInput] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'contas' | 'objetivos'>('contas')

  const balance = monthlyBudget - totalMonthly
  const TABS = [
    { key: 'contas',    label: '📋 Contas' },
    { key: 'objetivos', label: '🎯 Objetivos' },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="💰"
        title="Financeiro"
        description="Contas, prazos e objetivos de poupança da família"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Renda persistida */}
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Renda mensal</p>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400">R$</span>
            <input
              type="number"
              value={budgetInput !== '' ? budgetInput : (monthlyBudget || '')}
              onChange={e => setBudgetInput(e.target.value)}
              onBlur={() => {
                if (budgetInput !== '') {
                  saveMonthlyBudget(Number(budgetInput))
                  setBudgetInput('')
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  saveMonthlyBudget(Number(budgetInput))
                  setBudgetInput('')
                  ;(e.target as HTMLInputElement).blur()
                }
              }}
              className="text-xl font-bold w-full outline-none"
              placeholder="0,00"
            />
            {isSavingBudget && <span className="text-xs text-gray-400">💾</span>}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Total contas</p>
          <p className="text-xl font-bold text-red-600">
            R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{bills.length} conta{bills.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Já pago</p>
          <p className="text-xl font-bold text-green-600">
            R$ {paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Pendente: R$ {pendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`rounded-xl border p-4 ${
          balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-xs text-gray-500 mb-1">Saldo estimado</p>
          <p className={`text-xl font-bold ${
            balance >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {balance >= 0 ? '✅ Dentro do orçamento' : '⚠️ Acima do orçamento'}
          </p>
        </div>
      </div>

      {/* Gráfico de categorias */}
      <CategoryChart bills={bills} />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-all ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: Contas */}
      {activeTab === 'contas' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <h2 className="font-semibold">📋 Contas do mês</h2>
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedBill(null); setBillOpen(true) }}
            >
              + Adicionar
            </button>
          </div>
          {bills.length === 0 ? (
            <EmptyState title="Nenhuma conta" description="Cadastre as contas fixas e variáveis do mês." />
          ) : (
            <div className="divide-y">
              {bills.map(b => {
                const urgency = getBillUrgency(b)
                const cfg = URGENCY_CONFIG[urgency]
                return (
                  <div key={b.id} className={`px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${
                    urgency === 'overdue' ? 'border-l-2 border-l-red-400' :
                    urgency === 'due_soon' ? 'border-l-2 border-l-yellow-400' : ''
                  }`}>
                    {/* Semáforo */}
                    <span className="text-base shrink-0" title={cfg.label}>{cfg.emoji}</span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{b.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {b.due_day && <span>Dia {b.due_day}</span>}
                        {b.category && (
                          <span className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-medium"
                            style={{ background: CATEGORY_COLORS[b.category] ?? '#7a7974' }}
                          >
                            {CATEGORY_LABEL[b.category] ?? b.category}
                          </span>
                        )}
                        {b.payment_method && (
                          <span>{METHOD_LABEL[b.payment_method] ?? b.payment_method}</span>
                        )}
                      </div>
                    </div>

                    {/* Valor */}
                    <p className="font-bold text-sm tabular-nums shrink-0">
                      R$ {(b.amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>

                    {/* Status select */}
                    <select
                      value={b.status ?? 'pending'}
                      onChange={e => updateStatus(b.id, e.target.value as Bill['status'])}
                      className={`text-xs border rounded-lg px-1.5 py-1 shrink-0 ${
                        b.status === 'paid'       ? 'bg-green-100 text-green-700 border-green-200' :
                        b.status === 'auto_debit' ? 'bg-blue-100  text-blue-700  border-blue-200'  :
                        b.status === 'overdue'    ? 'bg-red-100   text-red-700   border-red-200'   :
                                                    'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      <option value="pending">⏳ Pendente</option>
                      <option value="paid">✅ Pago</option>
                      <option value="auto_debit">🔄 Débito auto</option>
                      <option value="overdue">🔴 Atrasado</option>
                    </select>

                    {/* Ações */}
                    <div className="flex gap-1 shrink-0">
                      <button
                        className="text-xs text-gray-400 hover:text-gray-600 p-1"
                        onClick={() => { setSelectedBill(b); setBillOpen(true) }}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className="text-xs text-gray-400 hover:text-red-500 p-1"
                        onClick={() => removeBill(b.id)}
                        title="Remover"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: Objetivos de Poupança */}
      {activeTab === 'objetivos' && (
        <div className="space-y-4">
          {/* Resumo geral de objetivos */}
          {goals.length > 0 && (
            <div className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">Progresso geral</p>
                <p className="text-xs text-gray-400">
                  {goals.filter(g => g.is_completed).length}/{goals.length} concluídos
                </p>
              </div>
              <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-500"
                  style={{ width: totalTarget > 0 ? `${Math.min((totalSaved / totalTarget) * 100, 100)}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1.5">
                <span className="text-teal-600 font-medium">R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} guardados</span>
                <span className="text-gray-400">Meta: R$ {totalTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h2 className="font-semibold">🎯 Objetivos</h2>
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedGoal(null); setGoalOpen(true) }}
            >
              + Novo objetivo
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="rounded-xl border bg-white">
              <EmptyState
                title="Nenhum objetivo"
                description="Crie um objetivo como ✈️ Viagem Inglaterra 2026 e acompanhe seu progresso."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.map(goal => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  onDeposit={addDeposit}
                  onEdit={g => { setSelectedGoal(g); setGoalOpen(true) }}
                  onDelete={removeGoal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sheets */}
      <BillSheet
        open={billOpen}
        onClose={() => setBillOpen(false)}
        bill={selectedBill}
        onSave={upsertBill}
      />
      <SavingsGoalSheet
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        goal={selectedGoal}
        onSave={upsertGoal}
      />
    </div>
  )
}
