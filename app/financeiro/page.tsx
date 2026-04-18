'use client'

import { useState, useMemo } from 'react'
import { useBills, getBillUrgency, URGENCY_CONFIG, getBillsByCategory } from '@/hooks/useBills'
import { useSavingsGoals, getMotivationalMessage } from '@/hooks/useSavingsGoals'
import { useBudgetGoals } from '@/hooks/useBudgetGoals'
import { useMonthlyHistory } from '@/hooks/useMonthlyHistory'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { BillSheet } from '@/components/sheets/BillSheet'
import { SavingsGoalSheet } from '@/components/sheets/SavingsGoalSheet'
import { BudgetGoalSheet } from '@/components/sheets/BudgetGoalSheet'
import type { Bill, SavingsGoal, BudgetGoal } from '@/types/database'

const CATEGORY_COLORS: Record<string, string> = {
  Moradia: '#01696f', 'Alimentação': '#437a22', 'Saúde': '#a12c7b',
  Transporte: '#006494', 'Educação': '#7a39bb', Lazer: '#da7101',
  'Serviços': '#d19900', Outros: '#7a7974',
  fixed: '#01696f', variable: '#da7101', emergency: '#a12c7b', savings: '#437a22',
}

const CATEGORY_LABEL: Record<string, string> = {
  fixed: 'Fixo', variable: 'Variável', emergency: 'Emergência', savings: 'Poupança',
}

const METHOD_LABEL: Record<string, string> = {
  credit_card: '💳 Crédito', debit_card: '💳 Débito', pix: '📱 Pix',
  bank_slip: '🏦 Boleto', auto_debit: '🔄 Débito auto', cash: '💵 Dinheiro',
}

const CURRENCY_SYMBOL: Record<string, string> = { BRL: 'R$', GBP: '£', USD: '$', EUR: '€' }

function fmt(value: number, currency = 'BRL') {
  return `${CURRENCY_SYMBOL[currency] ?? currency} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function HistoricoTab() {
  const { history, isLoading } = useMonthlyHistory()

  if (isLoading) return <div className="p-4 text-center text-gray-500">A carregar histórico...</div>

  if (history.length === 0) {
    return <EmptyState emoji="📊" title="Sem histórico" description="Os meses concluídos aparecerão aqui assim que as primeiras contas forem pagas." />
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        📊 Comparativo Mensal
      </h2>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Mês</th>
                <th className="px-6 py-3">Contas Pagas</th>
                <th className="px-6 py-3">Receita (Teto)</th>
                <th className="px-6 py-3">Total Gasto</th>
                <th className="px-6 py-3">Saldo Final</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.map((row, idx) => {
                const dataFormatada = new Date(row.month_ref).toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })

                const isPositive = row.balance >= 0

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium capitalize">{dataFormatada}</td>
                    <td className="px-6 py-4 text-gray-600">{row.bills_count} itens</td>
                    <td className="px-6 py-4 text-gray-600">R$ {Number(row.income).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">R$ {Number(row.total_paid).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isPositive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        R$ {Number(row.balance).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CategoryDonut({ bills }: { bills: Bill[] }) {
  const data = getBillsByCategory(bills)
  const total = data.reduce((s, d) => s + d.total, 0)
  if (total === 0) return null
  const SIZE = 120, R = 44, STROKE = 18
  const circ = 2 * Math.PI * R
  let offset = 0
  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="text-sm font-semibold mb-3">📊 Gastos por categoria</h3>
      <div className="flex items-center gap-6">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="shrink-0">
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="#f3f0ec" strokeWidth={STROKE} />
          {data.map(d => {
            const dash = (d.total / total) * circ
            const cur = offset; offset += dash
            return (
              <circle key={d.category} cx={SIZE/2} cy={SIZE/2} r={R} fill="none"
                stroke={CATEGORY_COLORS[d.category] ?? '#7a7974'} strokeWidth={STROKE}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={circ / 4 - cur}
                style={{ transition: 'stroke-dasharray .4s ease' }}
              />
            )
          })}
          <text x={SIZE/2} y={SIZE/2-6} textAnchor="middle" fontSize="10" fill="#7a7974">Total</text>
          <text x={SIZE/2} y={SIZE/2+8} textAnchor="middle" fontSize="11" fontWeight="600" fill="#28251d">
            {total >= 1000 ? `R$${(total/1000).toFixed(1)}k` : `R$${total.toFixed(0)}`}
          </text>
        </svg>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {data.map(d => (
            <div key={d.category} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: CATEGORY_COLORS[d.category] ?? '#7a7974' }} />
              <span className="text-gray-600 truncate flex-1">
                {CATEGORY_LABEL[d.category] ?? d.category}
              </span>
              <span className="font-medium tabular-nums">
                {((d.total/total)*100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MonthForecast({
  bills,
  monthlyBudget,
  onEditBill,
}: {
  bills: Bill[]
  monthlyBudget: number
  onEditBill: (b: Bill) => void
}) {
  const today = new Date().getDate()
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()

  const recurring = bills.filter(b => b.is_recurring)
  const withDueDay = recurring.filter(b => b.due_day !== null)
  const missingDueDay = recurring.filter(b => b.due_day === null)

  const upcomingTotal = withDueDay
    .filter(b => (b.due_day ?? 0) >= today && b.status !== 'paid' && b.status !== 'auto_debit')
    .reduce((s, b) => s + (b.amount ?? 0), 0)

  const paidRecurring = withDueDay
    .filter(b => b.status === 'paid' || b.status === 'auto_debit')
    .reduce((s, b) => s + (b.amount ?? 0), 0)

  const projectedBalance = monthlyBudget - paidRecurring - upcomingTotal
  const dayPct = (today / daysInMonth) * 100

  if (recurring.length === 0) return null

  return (
    <div className="rounded-xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">📆 Previsão do mês</h3>
        <span className="text-xs text-gray-400">Dia {today}/{daysInMonth}</span>
      </div>

      <div className="relative">
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${dayPct}%` }} />
        </div>
        {withDueDay.map(b => {
          const left = ((b.due_day ?? 1) / daysInMonth) * 100
          const isPast = (b.due_day ?? 0) < today
          const isPaid = b.status === 'paid' || b.status === 'auto_debit'
          return (
            <div
              key={b.id}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${left}%` }}
              title={`${b.title} — dia ${b.due_day}`}
            >
              <div className={`w-2 h-2 rounded-full mt-[-3px] ${
                isPaid ? 'bg-green-500' :
                isPast ? 'bg-red-500' : 'bg-yellow-400'
              }`} />
            </div>
          )
        })}
      </div>

      <div className="space-y-1.5">
        {withDueDay
          .filter(b => (b.due_day ?? 0) >= today && b.status !== 'paid')
          .slice(0, 4)
          .map(b => {
            const days = (b.due_day ?? 0) - today
            return (
              <div key={b.id} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  days <= 3 ? 'bg-red-400' : 'bg-yellow-400'
                }`} />
                <span className="flex-1 truncate text-gray-700">{b.title}</span>
                <span className="text-gray-400">
                  {days === 0 ? 'Hoje' : `em ${days}d`}
                </span>
                <span className="font-medium tabular-nums">
                  {fmt(b.amount ?? 0)}
                </span>
              </div>
            )
          })}
      </div>

      {monthlyBudget > 0 && (
        <div className={`rounded-lg px-3 py-2 text-sm font-medium ${
          projectedBalance >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          Saldo projetado no dia 30:{' '}
          <span className="font-bold">{fmt(projectedBalance)}</span>
        </div>
      )}

      {missingDueDay.length > 0 && (
        <div className="rounded-lg border border-dashed border-yellow-300 bg-yellow-50 p-2.5">
          <p className="text-xs text-yellow-700 font-medium mb-1.5">
            ⚠️ {missingDueDay.length} conta{missingDueDay.length > 1 ? 's' : ''} sem dia de vencimento
          </p>
          <div className="space-y-1">
            {missingDueDay.map(b => (
              <div key={b.id} className="flex items-center justify-between text-xs">
                <span className="text-yellow-800 truncate flex-1">{b.title}</span>
                <button
                  onClick={() => onEditBill(b)}
                  className="text-teal-600 font-medium hover:underline ml-2 shrink-0"
                >
                  Preencher dia →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function BudgetGoalCard({
  item, onEdit, onDelete,
}: {
  item: ReturnType<typeof import('@/hooks/useBudgetGoals').enrichGoalsWithSpent>[0]
  onEdit: (g: BudgetGoal) => void
  onDelete: (id: string) => void
}) {
  const color = item.color_hex ?? CATEGORY_COLORS[item.category] ?? '#7a7974'
  const statusColor =
    item.status === 'over' ? '#ef4444' :
    item.status === 'warning' ? '#ca8a04' : color
  const label = CATEGORY_LABEL[item.category] ?? item.category

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{item.icon ?? '📦'}</span>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-gray-400">
              Alerta em {item.alert_pct}% do limite
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(item)} className="text-xs text-gray-400 hover:text-gray-600 px-1">✏️</button>
          <button onClick={() => onDelete(item.id)} className="text-xs text-gray-400 hover:text-red-500 px-1">×</button>
        </div>
      </div>

      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-1.5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(item.pct, 100)}%`, background: statusColor }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span style={{ color: statusColor }} className="font-medium">
          {item.status === 'over' ? '🔴' : item.status === 'warning' ? '🟡' : '🟢'}{' '}
          {fmt(item.spent)} gastos
        </span>
        <span className="text-gray-400">Limite: {fmt(item.monthly_limit)}</span>
      </div>

      {item.status === 'over' && (
        <p className="text-xs text-red-500 mt-1">
          Estourou {fmt(item.spent - item.monthly_limit)} acima do limite
        </p>
      )}
    </div>
  )
}

function SavingsGoalCard({
  goal, monthlySavings, onDeposit, onEdit, onDelete,
}: {
  goal: SavingsGoal
  monthlySavings: number
  onDeposit: (id: string, amount: number) => void
  onEdit: (g: SavingsGoal) => void
  onDelete: (id: string) => void
}) {
  const [depositOpen, setDepositOpen] = useState(false)
  const [depositValue, setDepositValue] = useState('')
  const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
  const remaining = goal.target_amount - goal.current_amount
  const currency = goal.currency ?? 'BRL'
  const motivational = getMotivationalMessage(goal, monthlySavings)

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

      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium" style={{ color: goal.color_hex ?? '#01696f' }}>
            {fmt(goal.current_amount, currency)}
          </span>
          <span className="text-gray-400">{fmt(goal.target_amount, currency)}</span>
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
            <span className="text-gray-400">Faltam {fmt(remaining, currency)}</span>
          )}
        </div>
      </div>

      {deadlineDays !== null && !goal.is_completed && (
        <p className={`text-xs mb-2 ${
          deadlineDays < 0 ? 'text-red-500' : deadlineDays <= 30 ? 'text-yellow-600' : 'text-gray-400'
        }`}>
          {deadlineDays < 0
            ? `⚠️ Prazo vencido há ${Math.abs(deadlineDays)} dias`
            : `📅 ${deadlineDays} dias restantes`}
        </p>
      )}

      {motivational && (
        <div className="rounded-lg bg-teal-50 border border-teal-100 px-3 py-2 mb-3">
          <p className="text-xs text-teal-700">{motivational}</p>
        </div>
      )}

      {!goal.is_completed && (
        depositOpen ? (
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
            <button onClick={() => setDepositOpen(false)} className="text-sm text-gray-400 hover:text-gray-600">✕</button>
          </div>
        ) : (
          <button
            onClick={() => setDepositOpen(true)}
            className="w-full text-xs text-center py-1.5 rounded-lg border border-dashed border-teal-300 text-teal-600 hover:bg-teal-50 transition-colors"
          >
            + Registrar depósito
          </button>
        )
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

  const {
    enriched: budgetEnriched, uncovered,
    upsert: upsertBudget, remove: removeBudget,
  } = useBudgetGoals(bills)

  const [billOpen, setBillOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [goalOpen, setGoalOpen] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<BudgetGoal | null>(null)
  const [budgetInput, setBudgetInput] = useState('')
  const [activeTab, setActiveTab] = useState<'contas' | 'orcamento' | 'objetivos' | 'historico'>('contas')

  const balance = monthlyBudget - totalMonthly
  const monthlySavings = useMemo(() => Math.max(0, balance), [balance])

  const TABS = [
    { key: 'contas', label: '📋 Contas' },
    { key: 'orcamento', label: '📊 Orçamento' },
    { key: 'objetivos', label: '🎯 Objetivos' },
    { key: 'historico', label: '📜 Histórico' },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        emoji="💰"
        title="Financeiro"
        description="Contas, orçamento e objetivos de poupança"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Renda mensal</p>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-400">R$</span>
            <input
              type="number"
              value={budgetInput !== '' ? budgetInput : (monthlyBudget || '')}
              onChange={e => setBudgetInput(e.target.value)}
              onBlur={() => { if (budgetInput !== '') { saveMonthlyBudget(Number(budgetInput)); setBudgetInput('') } }}
              onKeyDown={e => { if (e.key === 'Enter') { saveMonthlyBudget(Number(budgetInput)); setBudgetInput(''); (e.target as HTMLInputElement).blur() } }}
              className="text-xl font-bold w-full outline-none"
              placeholder="0,00"
            />
            {isSavingBudget && <span className="text-xs text-gray-400">💾</span>}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Total contas</p>
          <p className="text-xl font-bold text-red-600 tabular-nums">
            R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{bills.length} conta{bills.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500 mb-1">Já pago</p>
          <p className="text-xl font-bold text-green-600 tabular-nums">
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
          <p className={`text-xl font-bold tabular-nums ${
            balance >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {balance >= 0 ? '✅ Dentro do orçamento' : '⚠️ Acima do orçamento'}
          </p>
        </div>
      </div>

      <MonthForecast
        bills={bills}
        monthlyBudget={monthlyBudget}
        onEditBill={b => { setSelectedBill(b); setBillOpen(true) }}
      />

      <CategoryDonut bills={bills} />

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
            <EmptyState emoji="💸" title="Nenhuma conta" description="Cadastre as contas fixas e variáveis do mês." />
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
                    <span className="text-base shrink-0" title={cfg.label}>{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{b.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        {b.due_day && <span>Dia {b.due_day}</span>}
                        {b.category && (
                          <span className="px-1.5 py-0.5 rounded-full text-white text-[10px] font-medium"
                            style={{ background: CATEGORY_COLORS[b.category] ?? '#7a7974' }}>
                            {CATEGORY_LABEL[b.category] ?? b.category}
                          </span>
                        )}
                        {b.payment_method && <span>{METHOD_LABEL[b.payment_method] ?? b.payment_method}</span>}
                      </div>
                    </div>
                    <p className="font-bold text-sm tabular-nums shrink-0">
                      {fmt(b.amount ?? 0)}
                    </p>
                    <select
                      value={b.status ?? 'pending'}
                      onChange={e => updateStatus(b.id, e.target.value as Bill['status'])}
                      className={`text-xs border rounded-lg px-1.5 py-1 shrink-0 ${
                        b.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                        b.status === 'auto_debit' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        b.status === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      <option value="pending">⏳ Pendente</option>
                      <option value="paid">✅ Pago</option>
                      <option value="auto_debit">🔄 Débito auto</option>
                      <option value="overdue">🔴 Atrasado</option>
                    </select>
                    <div className="flex gap-1 shrink-0">
                      <button className="text-xs text-gray-400 hover:text-gray-600 p-1"
                        onClick={() => { setSelectedBill(b); setBillOpen(true) }}>✏️</button>
                      <button className="text-xs text-gray-400 hover:text-red-500 p-1"
                        onClick={() => removeBill(b.id)}>×</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orcamento' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">📊 Metas por categoria</h2>
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setSelectedBudget(null); setBudgetOpen(true) }}
            >
              + Nova meta
            </button>
          </div>

          {budgetEnriched.length === 0 && uncovered.length === 0 ? (
            <div className="rounded-xl border bg-white">
              <EmptyState
                emoji="🎯"
                title="Nenhuma meta de orçamento"
                description="Defina limites por categoria para controlar seus gastos mensais."
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {budgetEnriched.map(item => (
                  <BudgetGoalCard
                    key={item.id}
                    item={item}
                    onEdit={g => { setSelectedBudget(g); setBudgetOpen(true) }}
                    onDelete={removeBudget}
                  />
                ))}
              </div>

              {uncovered.length > 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 font-medium mb-2">
                    💡 Categorias com gastos mas sem meta definida:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {uncovered.map(u => (
                      <button
                        key={u.category}
                        onClick={() => {
                          setSelectedBudget(null)
                          setBudgetOpen(true)
                        }}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:border-teal-400 hover:text-teal-600 transition-colors"
                      >
                        {CATEGORY_LABEL[u.category] ?? u.category} — {fmt(u.spent)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'objetivos' && (
        <div className="space-y-4">
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
                <span className="text-teal-600 font-medium tabular-nums">
                  R$ {totalSaved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} guardados
                </span>
                <span className="text-gray-400 tabular-nums">
                  Meta: R$ {totalTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
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
                emoji="🏆"
                title="Nenhum objetivo"
                description="Crie um objetivo como ✈️ Viagem Inglaterra 2026 e acompanhe o progresso."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.map(goal => (
                <SavingsGoalCard
                  key={goal.id}
                  goal={goal}
                  monthlySavings={monthlySavings}
                  onDeposit={addDeposit}
                  onEdit={g => { setSelectedGoal(g); setGoalOpen(true) }}
                  onDelete={removeGoal}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'historico' && <HistoricoTab />}

      <BillSheet open={billOpen} onClose={() => setBillOpen(false)} bill={selectedBill} onSave={upsertBill} />
      <SavingsGoalSheet open={goalOpen} onClose={() => setGoalOpen(false)} goal={selectedGoal} onSave={upsertGoal} />
      <BudgetGoalSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} goal={selectedBudget} bills={bills} onSave={upsertBudget} />
    </div>
  )
}
