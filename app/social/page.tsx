'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useSocialEvents } from '@/hooks/useSocialEvents'
import { useSocialEventTasks } from '@/hooks/useSocialEventTasks'
import { useSocialEventShopping } from '@/hooks/useSocialEventShopping'
import { useSocialEventContacts } from '@/hooks/useSocialEventContacts'
import { useSocialEventExpenses } from '@/hooks/useSocialEventExpenses'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SocialEventSheet } from '@/components/sheets/SocialEventSheet'
import { SocialEventTaskSheet } from '@/components/sheets/SocialEventTaskSheet'
import { SocialEventShoppingSheet } from '@/components/sheets/SocialEventShoppingSheet'
import { SocialEventContactSheet } from '@/components/sheets/SocialEventContactSheet'
import { SocialEventExpenseSheet } from '@/components/sheets/SocialEventExpenseSheet'
import { daysUntil, formatDate } from '@/lib/utils'
import { AgendamentoSheet } from '@/components/sheets/AgendamentoSheet'
import { useQuickSchedule } from '@/hooks/useQuickSchedule'
import type {
  SocialEvent,
  SocialEventTask,
  SocialEventShopping,
  SocialEventContact,
  SocialEventExpense,
} from '@/types/database'

// ─── lookup helpers ────────────────────────────────────────────────────────────
const EVENT_TYPE_LABEL: Record<string, string> = {
  birthday:    '🎂 Aniversário',
  anniversary: '💍 Casamento',
  party:       '🎉 Festa',
  wedding:     '💒 Casamento',
  baby_shower: '🍼 Chá de bebê',
  holiday:     '🏖️ Feriado',
  graduation:  '🎓 Formatura',
  other:       '📅 Evento',
}

const EVENT_STATUS: Record<string, { label: string; cls: string }> = {
  planning:  { label: '📝 Planejando', cls: 'bg-blue-100 text-blue-700' },
  confirmed: { label: '✅ Confirmado', cls: 'bg-green-100 text-green-700' },
  done:      { label: '🎉 Realizado',  cls: 'bg-gray-100 text-gray-600' },
  cancelled: { label: '❌ Cancelado',  cls: 'bg-red-100 text-red-600' },
}

const TASK_PRIORITY: Record<number, { label: string; cls: string }> = {
  1: { label: '🔴 Alta',  cls: 'bg-red-100 text-red-700' },
  2: { label: '🟡 Média', cls: 'bg-yellow-100 text-yellow-700' },
  3: { label: '⚪ Baixa', cls: 'bg-gray-100 text-gray-500' },
}

const RSVP_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: '⏳ Pendente',  cls: 'bg-orange-100 text-orange-700' },
  confirmed: { label: '✅ Confirmado', cls: 'bg-green-100 text-green-700' },
  declined:  { label: '❌ Recusou',   cls: 'bg-red-100 text-red-600' },
  maybe:     { label: '🤔 Talvez',    cls: 'bg-blue-100 text-blue-700' },
}

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: '⏳ Pendente', cls: 'bg-orange-100 text-orange-700' },
  partial: { label: '🔶 Parcial',  cls: 'bg-yellow-100 text-yellow-700' },
  paid:    { label: '✅ Pago',     cls: 'bg-green-100 text-green-700' },
}

const CONTACT_ROLE: Record<string, string> = {
  guest:  '👤 Convidado',
  vendor: '🏢 Fornecedor',
  helper: '🙋 Ajudante',
  other:  '📋 Outro',
}

function fmtBRL(v: number | null | undefined) {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function countdownBadge(dateStr: string | null): { label: string; cls: string } {
  if (!dateStr) return { label: '—', cls: 'text-gray-400' }
  const days = daysUntil(dateStr)
  if (days == null) return { label: '—', cls: 'text-gray-400' }
  if (days < 0)   return { label: `${Math.abs(days)}d atrás`, cls: 'bg-gray-100 text-gray-500' }
  if (days === 0) return { label: 'Hoje!',                     cls: 'bg-green-100 text-green-700' }
  if (days <= 7)  return { label: `${days}d`,                  cls: 'bg-red-100 text-red-700' }
  if (days <= 30) return { label: `${days}d`,                  cls: 'bg-yellow-100 text-yellow-700' }
  return { label: `${days}d`,                                   cls: 'bg-blue-100 text-blue-700' }
}

type Tab = 'eventos' | 'checklist' | 'compras' | 'contatos' | 'orcamento'

// ═══════════════════════════════════════════════════════════════════════════════
export default function SocialPage() {
  const { members } = useFamilyStore()

  const events    = useSocialEvents()
  const tasks     = useSocialEventTasks()
  const shopping  = useSocialEventShopping()
  const contacts  = useSocialEventContacts()
  const expenses  = useSocialEventExpenses()

  const { schedule, schedOpen, setSchedOpen, schedPrefill, upsertTask, upsertEvent, schedFamilyId, schedMembers } = useQuickSchedule()

  const [tab, setTab] = useState<Tab>('eventos')
  const [filterEvent, setFilterEvent] = useState<string>('all')

  // ── sheet state ──────────────────────────────────────────────────────────────
  const [eventOpen, setEventOpen]         = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<SocialEvent | null>(null)

  const [taskOpen, setTaskOpen]         = useState(false)
  const [selectedTask, setSelectedTask] = useState<SocialEventTask | null>(null)

  const [shopOpen, setShopOpen]           = useState(false)
  const [selectedShop, setSelectedShop]   = useState<SocialEventShopping | null>(null)

  const [contactOpen, setContactOpen]       = useState(false)
  const [selectedContact, setSelectedContact] = useState<SocialEventContact | null>(null)

  const [expenseOpen, setExpenseOpen]       = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<SocialEventExpense | null>(null)

  // ── helpers ──────────────────────────────────────────────────────────────────
  const getEventName = (id: string) => events.items.find(e => e.id === id)?.title ?? '—'
  const getMemberName = (id: string | null) => {
    if (!id) return '—'
    const m = members.find(m => m.id === id)
    return m?.nickname ?? m?.name ?? '—'
  }

  const byEvent = <T extends { event_id: string }>(arr: T[]) =>
    filterEvent === 'all' ? arr : arr.filter(i => i.event_id === filterEvent)

  const activeEvent = filterEvent !== 'all' ? filterEvent : (events.items[0]?.id ?? null)

  // ── alert counts ─────────────────────────────────────────────────────────────
  const pendingTasks    = tasks.items.filter(t => t.status === 'pending').length
  const notBoughtCount  = shopping.items.filter(s => !s.is_bought).length
  const pendingRSVP     = contacts.items.filter(c => c.rsvp_status === 'pending' && c.role === 'guest').length
  const unpaidExpenses  = expenses.items.filter(e => e.payment_status === 'pending').length

  const noEvents = events.items.length === 0

  const TABS: { id: Tab; label: string; alerts: number }[] = [
    { id: 'eventos',   label: '🎉 Eventos',    alerts: 0 },
    { id: 'checklist', label: '✅ Checklist',  alerts: pendingTasks },
    { id: 'compras',   label: '🛒 Compras',    alerts: notBoughtCount },
    { id: 'contatos',  label: '📞 Contatos',   alerts: pendingRSVP },
    { id: 'orcamento', label: '💰 Orçamento',  alerts: unpaidExpenses },
  ]

  // ── action button por aba ────────────────────────────────────────────────────
  const actionButton = tab === 'eventos' ? (
    <button className="text-sm text-teal-600 font-medium hover:underline"
      onClick={() => { setSelectedEvent(null); setEventOpen(true) }}>
      + Evento
    </button>
  ) : tab === 'checklist' ? (
    <button
      className="text-sm text-teal-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
      disabled={noEvents}
      onClick={() => { setSelectedTask(null); setTaskOpen(true) }}>
      + Tarefa
    </button>
  ) : tab === 'compras' ? (
    <button
      className="text-sm text-teal-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
      disabled={noEvents}
      onClick={() => { setSelectedShop(null); setShopOpen(true) }}>
      + Item
    </button>
  ) : tab === 'contatos' ? (
    <button
      className="text-sm text-teal-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
      disabled={noEvents}
      onClick={() => { setSelectedContact(null); setContactOpen(true) }}>
      + Contato
    </button>
  ) : tab === 'orcamento' ? (
    <button
      className="text-sm text-teal-600 font-medium hover:underline disabled:opacity-40 disabled:no-underline"
      disabled={noEvents}
      onClick={() => { setSelectedExpense(null); setExpenseOpen(true) }}>
      + Despesa
    </button>
  ) : null

  const filteredTasks    = byEvent(tasks.items)
  const filteredShopping = byEvent(shopping.items)
  const filteredContacts = byEvent(contacts.items)
  const filteredExpenses = byEvent(expenses.items)

  // ── per-event stats (for event cards) ────────────────────────────────────────
  function eventStats(eventId: string) {
    const evTasks     = tasks.items.filter(t => t.event_id === eventId)
    const evShopping  = shopping.items.filter(s => s.event_id === eventId)
    const evExpenses  = expenses.items.filter(e => e.event_id === eventId)
    const evContacts  = contacts.items.filter(c => c.event_id === eventId && c.role === 'guest')

    const tasksDone   = evTasks.filter(t => t.status === 'done').length
    const shopBought  = evShopping.filter(s => s.is_bought).length
    const totalGuests = evContacts.reduce((acc, c) => acc + (c.party_size ?? 1), 0)
    const totalSpent  = evExpenses.filter(e => e.payment_status === 'paid').reduce((acc, e) => acc + (e.actual_amount ?? 0), 0)

    return {
      tasks: { done: tasksDone, total: evTasks.length },
      shopping: { bought: shopBought, total: evShopping.length },
      guests: totalGuests,
      spent: totalSpent,
    }
  }

  // ── vendors for current filter (for expense sheet) ───────────────────────────
  const vendorsForFilter = contacts.items.filter(c =>
    c.role === 'vendor' && (filterEvent === 'all' || c.event_id === filterEvent)
  )

  return (
    <div className="space-y-5">
      <PageHeader
        emoji="🎉"
        title="Social"
        description="Organize aniversários, festas e comemorações da família"
        action={actionButton}
      />

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.id
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.alerts > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {t.alerts}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filtro por evento (nas abas de subárea) ─────────────────────────── */}
      {tab !== 'eventos' && events.items.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[{ id: 'all', label: 'Todos os eventos' }, ...events.items.map(e => ({ id: e.id, label: e.title }))].map(opt => (
            <button key={opt.id}
              onClick={() => setFilterEvent(opt.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                filterEvent === opt.id
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-gray-200 text-gray-600 hover:border-teal-400'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* ══ ABA: EVENTOS ══════════════════════════════════════════════════════ */}
      {tab === 'eventos' && (
        events.isLoading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : events.items.length === 0 ? (
          <EmptyState
            emoji="🎉"
            title="Nenhum evento cadastrado"
            description="Crie o primeiro evento para começar a organizar aniversários, festas e comemorações."
            action={
              <button className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg font-medium hover:bg-teal-700"
                onClick={() => { setSelectedEvent(null); setEventOpen(true) }}>
                + Criar primeiro evento
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.items.map(ev => {
              const countdown = countdownBadge(ev.event_date)
              const status    = EVENT_STATUS[ev.status ?? 'planning'] ?? EVENT_STATUS.planning
              const stats     = eventStats(ev.id)
              const typeLabel = EVENT_TYPE_LABEL[ev.event_type ?? 'other'] ?? '📅 Evento'

              return (
                <div key={ev.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelectedEvent(ev); setEventOpen(true) }}>

                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-2xl">{ev.emoji ?? '🎉'}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-400">{typeLabel}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Date */}
                  {ev.event_date && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">
                        📅 {formatDate(ev.event_date)}
                        {ev.event_time && ` às ${ev.event_time.slice(0, 5)}`}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${countdown.cls}`}>
                        {countdown.label}
                      </span>
                    </div>
                  )}

                  {ev.location && (
                    <p className="text-xs text-gray-400 mb-3 truncate">📍 {ev.location}</p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-1 pt-3 border-t border-gray-50">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Tarefas</p>
                      <p className="text-sm font-medium text-gray-700">{stats.tasks.done}/{stats.tasks.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Compras</p>
                      <p className="text-sm font-medium text-gray-700">{stats.shopping.bought}/{stats.shopping.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Convidados</p>
                      <p className="text-sm font-medium text-gray-700">{stats.guests}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Gasto</p>
                      <p className="text-sm font-medium text-gray-700">{fmtBRL(stats.spent)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ══ ABA: CHECKLIST ════════════════════════════════════════════════════ */}
      {tab === 'checklist' && (
        tasks.isLoading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filteredTasks.length === 0 ? (
          <EmptyState
            emoji="✅"
            title="Nenhuma tarefa"
            description="Adicione tarefas para organizar o que precisa ser feito para o evento."
            action={
              !noEvents ? (
                <button className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg font-medium hover:bg-teal-700"
                  onClick={() => { setSelectedTask(null); setTaskOpen(true) }}>
                  + Adicionar tarefa
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => {
              const priority = TASK_PRIORITY[task.priority as number] ?? TASK_PRIORITY[3]
              return (
                <div key={task.id}
                  className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm">
                  <button
                    onClick={() => tasks.updateStatus(task.id, task.status === 'done' ? 'pending' : 'done')}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      task.status === 'done'
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-gray-300'
                    }`}>
                    {task.status === 'done' && <span className="text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400">{getEventName(task.event_id ?? '')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priority.cls}`}>{priority.label}</span>
                    {task.assigned_to && (
                      <span className="text-xs text-gray-500">{getMemberName(task.assigned_to)}</span>
                    )}
                    <button
                      onClick={() => { setSelectedTask(task); setTaskOpen(true) }}
                      className="text-gray-400 hover:text-teal-600 text-xs">✏️</button>
                    <button
                      onClick={() => tasks.remove(task.id)}
                      className="text-gray-300 hover:text-red-500 text-xs">🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ══ ABA: COMPRAS ══════════════════════════════════════════════════════ */}
      {tab === 'compras' && (
        shopping.isLoading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filteredShopping.length === 0 ? (
          <EmptyState
            emoji="🛒"
            title="Nenhum item de compra"
            description="Adicione itens que precisam ser comprados para o evento."
            action={
              !noEvents ? (
                <button className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg font-medium hover:bg-teal-700"
                  onClick={() => { setSelectedShop(null); setShopOpen(true) }}>
                  + Adicionar item
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredShopping.map(item => (
              <div key={item.id}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm">
                <button
                  onClick={() => shopping.toggleBought(item.id, !item.is_bought)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    item.is_bought
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-gray-300'
                  }`}>
                  {item.is_bought && <span className="text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.is_bought ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.quantity && `Qtd: ${item.quantity} · `}{getEventName(item.event_id ?? '')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {item.estimated_price != null && (
                    <span className="text-xs text-gray-500">{fmtBRL(item.estimated_price)}</span>
                  )}
                  <button onClick={() => { setSelectedShop(item); setShopOpen(true) }}
                    className="text-gray-400 hover:text-teal-600 text-xs">✏️</button>
                  <button onClick={() => shopping.remove(item.id)}
                    className="text-gray-300 hover:text-red-500 text-xs">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ══ ABA: CONTATOS ═════════════════════════════════════════════════════ */}
      {tab === 'contatos' && (
        contacts.isLoading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filteredContacts.length === 0 ? (
          <EmptyState
            emoji="📞"
            title="Nenhum contato"
            description="Adicione convidados, fornecedores e ajudantes do evento."
            action={
              !noEvents ? (
                <button className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg font-medium hover:bg-teal-700"
                  onClick={() => { setSelectedContact(null); setContactOpen(true) }}>
                  + Adicionar contato
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {filteredContacts.map(contact => {
              const rsvp = RSVP_STATUS[contact.rsvp_status ?? 'pending'] ?? RSVP_STATUS.pending
              return (
                <div key={contact.id}
                  className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{contact.name}</p>
                      <span className="text-xs text-gray-400">{CONTACT_ROLE[contact.role ?? 'other']}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {contact.phone && <p className="text-xs text-gray-400">📞 {contact.phone}</p>}
                      {contact.party_size && contact.party_size > 1 && (
                        <p className="text-xs text-gray-400">👥 {contact.party_size}</p>
                      )}
                      <p className="text-xs text-gray-400">{getEventName(contact.event_id ?? '')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.role === 'guest' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${rsvp.cls}`}>{rsvp.label}</span>
                    )}
                    <button onClick={() => { setSelectedContact(contact); setContactOpen(true) }}
                      className="text-gray-400 hover:text-teal-600 text-xs">✏️</button>
                    <button onClick={() => contacts.remove(contact.id)}
                      className="text-gray-300 hover:text-red-500 text-xs">🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ══ ABA: ORÇAMENTO ════════════════════════════════════════════════════ */}
      {tab === 'orcamento' && (
        expenses.isLoading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filteredExpenses.length === 0 ? (
          <EmptyState
            emoji="💰"
            title="Nenhuma despesa"
            description="Registre as despesas para controlar o orçamento do evento."
            action={
              !noEvents ? (
                <button className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg font-medium hover:bg-teal-700"
                  onClick={() => { setSelectedExpense(null); setExpenseOpen(true) }}>
                  + Adicionar despesa
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Totais */}
            <div className="grid grid-cols-3 gap-3">
              {(() => {
                const total    = filteredExpenses.reduce((a, e) => a + (e.estimated_amount ?? 0), 0)
                const paid     = filteredExpenses.filter(e => e.payment_status === 'paid').reduce((a, e) => a + (e.actual_amount ?? e.estimated_amount ?? 0), 0)
                const pending  = filteredExpenses.filter(e => e.payment_status === 'pending').reduce((a, e) => a + (e.estimated_amount ?? 0), 0)
                return (
                  <>
                    <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xs text-gray-400">Orçado</p>
                      <p className="text-sm font-semibold text-gray-800">{fmtBRL(total)}</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xs text-gray-400">Pago</p>
                      <p className="text-sm font-semibold text-green-600">{fmtBRL(paid)}</p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xs text-gray-400">Pendente</p>
                      <p className="text-sm font-semibold text-orange-600">{fmtBRL(pending)}</p>
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="space-y-2">
              {filteredExpenses.map(expense => {
                const payment = PAYMENT_STATUS[expense.payment_status ?? 'pending'] ?? PAYMENT_STATUS.pending
                return (
                  <div key={expense.id}
                    className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{expense.title}</p>
                      <p className="text-xs text-gray-400">
                        {expense.vendor_name && `${expense.vendor_name} · `}{getEventName(expense.event_id ?? '')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-800">{fmtBRL(expense.actual_amount ?? expense.estimated_amount)}</p>
                        {expense.actual_amount != null && expense.estimated_amount != null && expense.actual_amount !== expense.estimated_amount && (
                          <p className="text-xs text-gray-400">Est: {fmtBRL(expense.estimated_amount)}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${payment.cls}`}>{payment.label}</span>
                      <button onClick={() => { setSelectedExpense(expense); setExpenseOpen(true) }}
                        className="text-gray-400 hover:text-teal-600 text-xs">✏️</button>
                      <button onClick={() => expenses.remove(expense.id)}
                        className="text-gray-300 hover:text-red-500 text-xs">🗑️</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      )}

      {/* ── Sheets ────────────────────────────────────────────────────────────── */}
      <SocialEventSheet
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        item={selectedEvent}
        onSave={async (payload) => { await events.upsert(payload); setEventOpen(false) }}
        onDelete={async (id) => { await events.remove(id); setEventOpen(false) }}
        members={members}
      />
      <SocialEventTaskSheet
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        item={selectedTask}
        events={events.items}
        defaultEventId={activeEvent}
        onSave={async (payload) => { await tasks.upsert(payload); setTaskOpen(false) }}
        onDelete={async (id) => { await tasks.remove(id); setTaskOpen(false) }}
        members={members}
      />
      <SocialEventShoppingSheet
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        item={selectedShop}
        events={events.items}
        defaultEventId={activeEvent}
        onSave={async (payload) => { await shopping.upsert(payload); setShopOpen(false) }}
        onDelete={async (id) => { await shopping.remove(id); setShopOpen(false) }}
        members={members}
      />
      <SocialEventContactSheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        item={selectedContact}
        events={events.items}
        defaultEventId={activeEvent}
        onSave={async (payload) => { await contacts.upsert(payload); setContactOpen(false) }}
        onDelete={async (id) => { await contacts.remove(id); setContactOpen(false) }}
        members={members}
      />
      <SocialEventExpenseSheet
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        item={selectedExpense}
        events={events.items}
        vendors={vendorsForFilter}
        defaultEventId={activeEvent}
        onSave={async (payload) => { await expenses.upsert(payload); setExpenseOpen(false) }}
        onDelete={async (id) => { await expenses.remove(id); setExpenseOpen(false) }}
        members={members}
      />

      <AgendamentoSheet
        open={schedOpen}
        onClose={() => setSchedOpen(false)}
        prefill={schedPrefill}
        familyId={schedFamilyId ?? ''}
        members={schedMembers}
        onSaveTask={upsertTask}
        onSaveEvent={upsertEvent}
      />
    </div>
  )
}
