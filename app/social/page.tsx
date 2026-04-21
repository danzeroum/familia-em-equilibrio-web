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
  const getEventName = (id: string) => events.items.find(e => e.id === id)?.name ?? '—'
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
          {[{ id: 'all', label: 'Todos os eventos' }, ...events.items.map(e => ({ id: e.id, label: e.name }))].map(opt => (
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
              const status    = EVENT_STATUS[ev.status] ?? EVENT_STATUS.planning
              const stats     = eventStats(ev.id)
              const isCancelled = ev.status === 'cancelled' || ev.status === 'done'

              return (
                <div key={ev.id} className={`rounded-xl border bg-white p-4 flex flex-col gap-3 hover:shadow-md transition-shadow ${isCancelled ? 'opacity-60' : ''}`}>
                  {/* header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{ev.cover_emoji}</span>
                        <p className="font-semibold text-gray-800 text-sm leading-tight truncate">{ev.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{EVENT_TYPE_LABEL[ev.event_type] ?? ev.event_type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* data + countdown */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">📅 {formatDate(ev.event_date)}</span>
                    {ev.event_time && <span className="text-xs text-gray-400">⏰ {ev.event_time.slice(0, 5)}</span>}
                    {ev.event_date && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${countdown.cls}`}>
                        {countdown.label}
                      </span>
                    )}
                  </div>

                  {/* localização */}
                  {ev.location_name && (
                    <div className="text-xs text-gray-500 flex items-start gap-1">
                      <span>📍</span>
                      <span className="truncate">{ev.location_name}{ev.address ? ` — ${ev.address}` : ''}</span>
                    </div>
                  )}

                  {/* stats */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t text-xs text-gray-600">
                    <div>
                      <span className="text-gray-400">✅ Tarefas</span>
                      <br />
                      <span className="font-medium">{stats.tasks.done}/{stats.tasks.total}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">🛒 Compras</span>
                      <br />
                      <span className="font-medium">{stats.shopping.bought}/{stats.shopping.total}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">👥 Convidados</span>
                      <br />
                      <span className="font-medium">{stats.guests}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">💰 Gasto</span>
                      <br />
                      <span className="font-medium">{fmtBRL(stats.spent)}</span>
                      {ev.budget_planned && <span className="text-gray-400"> / {fmtBRL(ev.budget_planned)}</span>}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex gap-3 pt-1">
                    <button className="text-xs text-teal-600 hover:underline"
                      onClick={() => { setSelectedEvent(ev); setEventOpen(true) }}>
                      Editar
                    </button>
                    <button className="text-xs text-blue-500 hover:underline"
                      onClick={() => { setFilterEvent(ev.id); setTab('checklist') }}>
                      Ver checklist
                    </button>
                    <button className="text-xs text-red-400 hover:underline ml-auto"
                      onClick={() => {
                        if (confirm(`Remover "${ev.name}"? Todos os dados do evento serão excluídos.`))
                          events.remove(ev.id)
                      }}>
                      ×
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ══ ABA: CHECKLIST ════════════════════════════════════════════════════ */}
      {tab === 'checklist' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {tasks.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filteredTasks.length === 0 ? (
            <EmptyState
              emoji="✅"
              title="Nenhuma tarefa"
              description="Adicione tarefas para organizar o que precisa ser feito para o evento."
            />
          ) : (
            <div className="divide-y">
              {filteredTasks.map(task => {
                const prio = TASK_PRIORITY[task.priority] ?? TASK_PRIORITY[2]
                const done = task.status === 'done'
                return (
                  <div key={task.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 ${done ? 'opacity-60' : ''}`}>
                    <input
                      type="checkbox"
                      checked={done}
                      className="mt-0.5 accent-teal-600 cursor-pointer"
                      onChange={() => tasks.upsert({ ...task, status: done ? 'pending' : 'done' })}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                        <span>🎉 {getEventName(task.event_id)}</span>
                        {task.due_date && <span>📅 {formatDate(task.due_date)}</span>}
                        {task.assigned_to && <span>👤 {getMemberName(task.assigned_to)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${prio.cls}`}>{prio.label}</span>
                      <button className="text-xs text-teal-600 hover:underline"
                        onClick={() => { setSelectedTask(task); setTaskOpen(true) }}>
                        Editar
                      </button>
                      <button className="text-xs text-red-400 hover:underline"
                        onClick={() => tasks.remove(task.id)}>
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

      {/* ══ ABA: COMPRAS ══════════════════════════════════════════════════════ */}
      {tab === 'compras' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {shopping.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filteredShopping.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title="Nenhum item de compras"
              description="Adicione o que precisa comprar para o evento."
            />
          ) : (
            <div className="divide-y">
              {filteredShopping.map(item => (
                <div key={item.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 ${item.is_bought ? 'opacity-60' : ''}`}>
                  <input
                    type="checkbox"
                    checked={item.is_bought}
                    className="mt-0.5 accent-teal-600 cursor-pointer"
                    onChange={() => shopping.upsert({ ...item, is_bought: !item.is_bought })}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.is_bought ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.name}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                      <span>🎉 {getEventName(item.event_id)}</span>
                      {item.quantity != null && <span>Qtd: {item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>}
                      {item.store && <span>🏪 {item.store}</span>}
                      {item.estimated_price != null && <span>Prev: {fmtBRL(item.estimated_price)}</span>}
                      {item.actual_price != null && <span>Real: {fmtBRL(item.actual_price)}</span>}
                      {item.assigned_to && <span>👤 {getMemberName(item.assigned_to)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="text-xs text-teal-600 hover:underline"
                      onClick={() => { setSelectedShop(item); setShopOpen(true) }}>
                      Editar
                    </button>
                    <button className="text-xs text-red-400 hover:underline"
                      onClick={() => shopping.remove(item.id)}>
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ ABA: CONTATOS ═════════════════════════════════════════════════════ */}
      {tab === 'contatos' && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {contacts.isLoading ? (
            <div className="p-8 text-center text-gray-400">Carregando...</div>
          ) : filteredContacts.length === 0 ? (
            <EmptyState
              emoji="📞"
              title="Nenhum contato cadastrado"
              description="Adicione convidados, fornecedores e ajudantes do evento."
            />
          ) : (
            <>
              {/* Resumo de convidados */}
              {filteredContacts.some(c => c.role === 'guest') && (
                <div className="px-4 py-3 bg-gray-50 border-b flex flex-wrap gap-4 text-sm">
                  {(['confirmed', 'pending', 'declined', 'maybe'] as const).map(status => {
                    const count = filteredContacts.filter(c => c.role === 'guest' && c.rsvp_status === status)
                    const total = count.reduce((acc, c) => acc + (c.party_size ?? 1), 0)
                    if (count.length === 0) return null
                    const s = RSVP_STATUS[status]
                    return (
                      <span key={status} className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
                        {s.label}: {count.length} ({total} pess.)
                      </span>
                    )
                  })}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Nome</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-left">Evento</th>
                      <th className="px-4 py-3 text-left">RSVP / Status</th>
                      <th className="px-4 py-3 text-left">Contato</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredContacts.map(c => {
                      const rsvp = c.role === 'guest' ? (RSVP_STATUS[c.rsvp_status] ?? RSVP_STATUS.pending) : null
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {c.name}
                            {c.role === 'guest' && c.party_size > 1 && (
                              <span className="ml-1 text-xs text-gray-400">+{c.party_size - 1}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {CONTACT_ROLE[c.role] ?? c.role}
                            {c.vendor_type && <span className="block text-gray-400">{c.vendor_type}</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{getEventName(c.event_id)}</td>
                          <td className="px-4 py-3">
                            {rsvp ? (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rsvp.cls}`}>{rsvp.label}</span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {c.phone && <span className="block">{c.phone}</span>}
                            {c.email && <span className="block text-gray-400">{c.email}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <button className="text-xs text-teal-600 hover:underline"
                                onClick={() => { setSelectedContact(c); setContactOpen(true) }}>
                                Editar
                              </button>
                              <button className="text-xs text-red-400 hover:underline"
                                onClick={() => contacts.remove(c.id)}>
                                ×
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ ABA: ORÇAMENTO ════════════════════════════════════════════════════ */}
      {tab === 'orcamento' && (
        <div className="space-y-4">
          {/* Resumo financeiro */}
          {filteredExpenses.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Total previsto',
                  value: fmtBRL(filteredExpenses.reduce((acc, e) => acc + (e.planned_amount ?? 0), 0)),
                  cls: 'bg-blue-50 text-blue-700',
                },
                {
                  label: 'Total realizado',
                  value: fmtBRL(filteredExpenses.reduce((acc, e) => acc + (e.actual_amount ?? 0), 0)),
                  cls: 'bg-orange-50 text-orange-700',
                },
                {
                  label: 'Total pago',
                  value: fmtBRL(filteredExpenses.filter(e => e.payment_status === 'paid').reduce((acc, e) => acc + (e.actual_amount ?? 0), 0)),
                  cls: 'bg-green-50 text-green-700',
                },
              ].map(card => (
                <div key={card.label} className={`rounded-xl p-3 text-center ${card.cls}`}>
                  <p className="text-xs font-medium opacity-80">{card.label}</p>
                  <p className="text-base font-bold mt-1">{card.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border bg-white overflow-hidden">
            {expenses.isLoading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : filteredExpenses.length === 0 ? (
              <EmptyState
                emoji="💰"
                title="Nenhuma despesa registrada"
                description="Registre os custos do evento para acompanhar o orçamento."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Descrição</th>
                      <th className="px-4 py-3 text-left">Evento</th>
                      <th className="px-4 py-3 text-right">Previsto</th>
                      <th className="px-4 py-3 text-right">Real</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Venc.</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredExpenses.map(exp => {
                      const ps = PAYMENT_STATUS[exp.payment_status] ?? PAYMENT_STATUS.pending
                      return (
                        <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {exp.description}
                            {exp.category && <span className="block text-xs text-gray-400">{exp.category}</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{getEventName(exp.event_id)}</td>
                          <td className="px-4 py-3 text-right text-gray-600">{fmtBRL(exp.planned_amount)}</td>
                          <td className="px-4 py-3 text-right text-gray-800 font-medium">{fmtBRL(exp.actual_amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ps.cls}`}>{ps.label}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{formatDate(exp.due_date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-end">
                              <button className="text-xs text-teal-600 hover:underline"
                                onClick={() => { setSelectedExpense(exp); setExpenseOpen(true) }}>
                                Editar
                              </button>
                              <button className="text-xs text-red-400 hover:underline"
                                onClick={() => expenses.remove(exp.id)}>
                                ×
                              </button>
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
        </div>
      )}

      {/* ══ SHEETS ════════════════════════════════════════════════════════════ */}
      <SocialEventSheet
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        item={selectedEvent}
        onSave={async (i) => { await events.upsert(i); setEventOpen(false) }}
        members={members}
      />

      <SocialEventTaskSheet
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        item={selectedTask}
        eventId={activeEvent}
        onSave={async (i) => { await tasks.upsert(i); setTaskOpen(false) }}
        members={members}
      />

      <SocialEventShoppingSheet
        open={shopOpen}
        onClose={() => setShopOpen(false)}
        item={selectedShop}
        eventId={activeEvent}
        onSave={async (i) => { await shopping.upsert(i); setShopOpen(false) }}
        members={members}
      />

      <SocialEventContactSheet
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        item={selectedContact}
        eventId={activeEvent}
        onSave={async (i) => { await contacts.upsert(i); setContactOpen(false) }}
      />

      <SocialEventExpenseSheet
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        item={selectedExpense}
        eventId={activeEvent}
        vendors={vendorsForFilter}
        onSave={async (i) => { await expenses.upsert(i); setExpenseOpen(false) }}
      />
    </div>
  )
}
