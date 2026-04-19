'use client'

import { useState, useMemo } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useDashboard } from '@/hooks/useDashboard'
import { useMonthlyHistory } from '@/hooks/useMonthlyHistory'
import { useSavingsGoals } from '@/hooks/useSavingsGoals'
import { useTasks } from '@/hooks/useTasks'
import { useFamilyEvents } from '@/hooks/useFamilyEvents'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatTaskDateTime } from '@/lib/formatDateTime'
import { parseLocalDate } from '@/lib/utils'
import {
  asTask, asEvent,
  type AgendamentoItem,
  agDate, agTime, agIsDone,
} from '@/types/agendamento'

// ─── helpers de data ─────────────────────────────────────────────────────────

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-500',
  medium: 'bg-yellow-400',
  low:    'bg-green-500',
}
const PRIORITY_CARD: Record<string, string> = {
  high:   'border-l-2 border-l-red-400',
  medium: 'border-l-2 border-l-yellow-400',
  low:    'border-l-2 border-l-green-400',
}

const SOURCE_ICONS: Record<string, string> = {
  bill:        '💳',
  shopping:    '🛒',
  task:        '✅',
  maintenance: '🔧',
  event:       '📅',
  vaccine:     '💉',
  medication:  '💊',
}

function dayOnly(d: Date) {
  const r = new Date(d); r.setHours(0,0,0,0); return r
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
function getWeekStart(d: Date) {
  const r = dayOnly(d); r.setDate(r.getDate() - r.getDay()); return r
}
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month+1, 0).getDate()
}

type TaskView = 'dia' | 'semana' | 'mes' | 'ano' | 'lista'

// ─── ItemChip (tarefa ou evento) ─────────────────────────────────────────────

function ItemChip({ item, memberName }: { item: AgendamentoItem; memberName: (id: string|null) => string|null }) {
  const today     = dayOnly(new Date())
  const isEvent   = item._kind === 'event'
  const dateStr   = agDate(item)
  const isOverdue = !isEvent && dateStr && dayOnly(parseLocalDate(dateStr)) < today && !agIsDone(item)
  const priority  = item._kind === 'task' ? ((item as any).priority ?? 'low') : 'low'
  const time      = agTime(item)
  const name      = memberName(item.assigned_to ?? null)
  return (
    <div
      title={item.title}
      className={`rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer hover:opacity-75 transition-opacity
        ${isOverdue
          ? 'bg-red-100 text-red-800'
          : isEvent
            ? 'bg-blue-50/70 shadow-sm text-gray-700 border-l-2 border-l-blue-400'
            : `bg-white shadow-sm text-gray-700 ${PRIORITY_CARD[priority] ?? ''}`}`}
    >
      <div className="flex items-center gap-1">
        {isEvent
          ? <span className="text-[10px] flex-shrink-0">📅</span>
          : <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[priority] ?? 'bg-gray-300'}`} />}
        <span className="font-medium truncate">{item.title}</span>
      </div>
      {(time || name) && (
        <div className="text-gray-400 truncate mt-0.5">
          {time && <span>{time}</span>}
          {time && name && <span> · </span>}
          {name && <span>{name}</span>}
        </div>
      )}
    </div>
  )
}

// ─── NavBar ───────────────────────────────────────────────────────────────────

function NavBar({ label, onPrev, onNext, onToday, showToday }: {
  label: string; onPrev:()=>void; onNext:()=>void; onToday:()=>void; showToday: boolean
}) {
  return (
    <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50">
      <button onClick={onPrev} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors text-lg">‹</button>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        {showToday && (
          <button onClick={onToday} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Hoje</button>
        )}
      </div>
      <button onClick={onNext} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors text-lg">›</button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function PainelPage() {
  const { members, currentFamily } = useFamilyStore()

  // ── hooks de dados ──────────────────────────────────────────────────────
  const {
    focusItems,
    radarItems,
    overdueCount,
    todayCount,
    criticalRadar,
    isLoading: dashLoading,
  } = useDashboard()

  const { history }      = useMonthlyHistory()
  const { goals }        = useSavingsGoals()
  const { tasks }        = useTasks()
  const { events }       = useFamilyEvents(currentFamily?.id ?? null)

  // ── estado local ────────────────────────────────────────────────────────
  const [taskView, setTaskView] = useState<TaskView>('semana')
  const [offset,   setOffset]   = useState(0)

  const today      = useMemo(() => dayOnly(new Date()), [])
  const mergedItems: AgendamentoItem[] = useMemo(() => [
    ...tasks.map(asTask),
    ...events.map(asEvent),
  ], [tasks, events])
  const allPending = useMemo(() => mergedItems.filter(it => !agIsDone(it)), [mergedItems])

  // ── dados derivados ─────────────────────────────────────────────────────
  const currentMonth = history[0] ?? null
  const mainGoal     = goals.find(g => !g.is_completed) ?? null

  const memberName = (id: string | null) => {
    if (!id) return null
    const m = members.find(m => m.id === id)
    return m?.nickname ?? m?.name ?? null
  }

  const itemsForDay = (day: Date): AgendamentoItem[] =>
    allPending.filter(it => {
      const d = agDate(it)
      if (!d) return false
      return sameDay(dayOnly(parseLocalDate(d)), day)
    }).sort((a, b) => (agTime(a) ?? '').localeCompare(agTime(b) ?? ''))

  const itemsNoDate = allPending.filter(it => !agDate(it))

  const in7 = addDays(today, 7)
  const weekItems = allPending.filter(it => {
    const d = agDate(it)
    if (!d) return true
    return dayOnly(parseLocalDate(d)) <= in7
  }).sort((a, b) => {
    const ad = agDate(a); const bd = agDate(b)
    if (!ad) return 1; if (!bd) return -1
    const dc = parseLocalDate(ad).getTime() - parseLocalDate(bd).getTime()
    return dc !== 0 ? dc : (agTime(a) ?? '').localeCompare(agTime(b) ?? '')
  })

  const dayCountMap = useMemo(() => {
    const map: Record<string,number> = {}
    allPending.forEach(it => {
      const d = agDate(it)
      if (!d) return
      const key = d.slice(0,10)
      map[key] = (map[key] ?? 0) + 1
    })
    return map
  }, [allPending])

  function switchView(v: TaskView) { setTaskView(v); setOffset(0) }

  // ── Views: DIA ──────────────────────────────────────────────────────────
  const currentDay = addDays(today, offset)
  const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

  function ViewDia() {
    const dayItems  = itemsForDay(currentDay)
    const withTime  = dayItems.filter(it => !!agTime(it))
    const noTime    = dayItems.filter(it => !agTime(it))
    const isToday   = sameDay(currentDay, today)
    const label     = isToday
      ? 'Hoje'
      : currentDay.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    return (
      <div>
        <NavBar label={label} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        {noTime.length > 0 && (
          <div className="px-3 py-2 border-b bg-gray-50 flex flex-wrap gap-1 items-center">
            <span className="text-[10px] text-gray-400 font-semibold mr-1 uppercase tracking-wide">Dia todo</span>
            {noTime.map(it => <ItemChip key={`${it._kind}-${it.id}`} item={it} memberName={memberName}/>)}
          </div>
        )}
        <div className="overflow-y-auto max-h-[420px]">
          {HOURS.map(h => {
            const slotItems = withTime.filter(it => {
              const t = agTime(it); if (!t) return false
              const [th] = t.split(':').map(Number)
              return th === h
            })
            return (
              <div key={h} className={`flex border-b min-h-[44px] ${isToday && new Date().getHours()===h ? 'bg-teal-50' : ''}`}>
                <div className="w-12 flex-shrink-0 text-[10px] text-gray-400 font-medium pt-1 pl-3">{String(h).padStart(2,'0')}h</div>
                <div className="flex-1 p-1 flex flex-col gap-0.5">
                  {slotItems.map(it => <ItemChip key={`${it._kind}-${it.id}`} item={it} memberName={memberName}/>)}
                </div>
              </div>
            )
          })}
        </div>
        {dayItems.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum agendamento para este dia.</div>
        )}
      </div>
    )
  }

  // ── Views: SEMANA ───────────────────────────────────────────────────────
  const weekStart = addDays(getWeekStart(today), offset * 7)
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function ViewSemana() {
    const end   = addDays(weekStart, 6)
    const fmt   = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    const label = `${fmt(weekStart)} – ${fmt(end)}`
    return (
      <div>
        <NavBar label={label} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        <div className="overflow-x-auto">
        <div className="grid grid-cols-7 divide-x min-h-[180px] min-w-[560px] sm:min-w-0">
          {weekDays.map((day, idx) => {
            const isToday = sameDay(day, today)
            const isPast  = day < today && !isToday
            const dt      = itemsForDay(day)
            return (
              <div key={idx} className={`flex flex-col ${isToday ? 'bg-teal-50' : isPast ? 'bg-gray-50/60' : 'bg-white'}`}>
                <div className="flex flex-col items-center pt-2 pb-1 border-b">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-teal-600' : 'text-gray-400'}`}>{WEEKDAYS_SHORT[day.getDay()]}</span>
                  <span className={`text-sm font-bold leading-none mt-0.5 ${isToday ? 'text-teal-600' : isPast ? 'text-gray-300' : 'text-gray-700'}`}>{day.getDate()}</span>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dt.length > 0 ? (isToday ? 'bg-teal-500' : 'bg-gray-400') : 'bg-transparent'}`}/>
                </div>
                <div className="flex-1 p-1 space-y-0.5 overflow-hidden">
                  {dt.map(it => <ItemChip key={`${it._kind}-${it.id}`} item={it} memberName={memberName}/>)}
                </div>
              </div>
            )
          })}
        </div>
        </div>
        {itemsNoDate.length > 0 && (
          <div className="px-4 py-2 border-t bg-gray-50 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-400 font-medium mr-1">Sem data:</span>
            {itemsNoDate.map(it => (
              <span key={`${it._kind}-${it.id}`} className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5 truncate max-w-[120px]" title={it.title}>
                {it._kind === 'event' ? '📅 ' : ''}{it.title}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Views: MÊS ─────────────────────────────────────────────────────────
  const monthDate   = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const monthYear   = monthDate.getFullYear()
  const monthIdx    = monthDate.getMonth()
  const daysInMonth = getDaysInMonth(monthYear, monthIdx)
  const firstDow    = new Date(monthYear, monthIdx, 1).getDay()

  function ViewMes() {
    const label = `${MONTHS_PT[monthIdx]} ${monthYear}`
    const cells: (Date|null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(monthYear, monthIdx, i + 1)),
    ]
    while (cells.length % 7 !== 0) cells.push(null)
    return (
      <div>
        <NavBar label={label} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        <div className="overflow-x-auto">
        <div className="min-w-[560px] sm:min-w-0">
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x">
          {cells.map((day, i) => {
            if (!day) return <div key={i} className="border-b bg-gray-50/40 min-h-[64px]"/>
            const isToday = sameDay(day, today)
            const isPast  = day < today && !isToday
            const dt      = itemsForDay(day)
            const visible = dt.slice(0, 2)
            const extra   = dt.length - visible.length
            return (
              <div key={i} className={`border-b min-h-[64px] flex flex-col p-0.5 ${isToday ? 'bg-teal-50' : isPast ? 'bg-gray-50/40' : 'bg-white'}`}>
                <div className={`text-[11px] font-bold self-end w-5 h-5 flex items-center justify-center rounded-full mb-0.5 ${isToday ? 'bg-teal-600 text-white' : 'text-gray-500'}`}>{day.getDate()}</div>
                <div className="space-y-0.5 flex-1 overflow-hidden">
                  {visible.map(it => <ItemChip key={`${it._kind}-${it.id}`} item={it} memberName={memberName}/>)}
                  {extra > 0 && <div className="text-[10px] text-gray-400 font-medium pl-1">+{extra} mais</div>}
                </div>
              </div>
            )
          })}
        </div>
        </div>
        </div>
      </div>
    )
  }

  // ── Views: ANO ─────────────────────────────────────────────────────────
  const anoYear = today.getFullYear() + offset

  function heatColor(n: number) {
    if (n === 0) return 'bg-gray-100'
    if (n === 1) return 'bg-teal-200'
    if (n === 2) return 'bg-teal-400'
    if (n <= 4)  return 'bg-teal-500'
    return 'bg-teal-700'
  }

  function ViewAno() {
    return (
      <div>
        <NavBar label={String(anoYear)} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {MONTHS_SHORT.map((mName, mIdx) => {
            const dInM   = getDaysInMonth(anoYear, mIdx)
            const firstD = new Date(anoYear, mIdx, 1).getDay()
            const cells: (number|null)[] = [...Array(firstD).fill(null), ...Array.from({ length: dInM }, (_, i) => i + 1)]
            while (cells.length % 7 !== 0) cells.push(null)
            return (
              <div key={mIdx}>
                <div className="text-xs font-semibold text-gray-600 mb-1">{mName}</div>
                <div className="grid grid-cols-7 gap-px">
                  {WEEKDAYS_SHORT.map(d => (
                    <div key={d} className="text-[8px] text-gray-300 text-center">{d[0]}</div>
                  ))}
                  {cells.map((day, ci) => {
                    if (!day) return <div key={ci}/>
                    const key = `${anoYear}-${String(mIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    const cnt = dayCountMap[key] ?? 0
                    const isT = today.getFullYear()===anoYear && today.getMonth()===mIdx && today.getDate()===day
                    return (
                      <div
                        key={ci}
                        title={cnt > 0 ? `${day}/${mIdx+1}: ${cnt} agendamento${cnt>1?'s':''}` : `${day}/${mIdx+1}`}
                        className={`w-full aspect-square rounded-sm ${isT ? 'ring-1 ring-teal-600' : ''} ${heatColor(cnt)} cursor-default`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-4 pb-3 flex items-center gap-2 text-[10px] text-gray-400">
          <span>Menos</span>
          {['bg-gray-100','bg-teal-200','bg-teal-400','bg-teal-500','bg-teal-700'].map(c => (
            <span key={c} className={`w-3 h-3 rounded-sm ${c}`}/>
          ))}
          <span>Mais</span>
        </div>
      </div>
    )
  }

  // ── Views: LISTA ────────────────────────────────────────────────────────
  function ViewLista() {
    return weekItems.length === 0 ? (
      <div className="p-6 text-center text-gray-400 text-sm">Nenhum agendamento pendente para os próximos 7 dias.</div>
    ) : (
      <ul className="divide-y">
        {weekItems.map(it => {
          const isEvent   = it._kind === 'event'
          const dateStr   = agDate(it)
          const time      = agTime(it)
          const isOverdue = !isEvent && dateStr && dayOnly(parseLocalDate(dateStr)) < today
          const dateTime  = formatTaskDateTime(dateStr, time)
          return (
            <li key={`${it._kind}-${it.id}`} className={`px-4 py-3 flex items-center gap-3 ${isEvent ? 'border-l-2 border-l-blue-400' : ''}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : isEvent ? 'bg-blue-500' : 'bg-teal-500'}`}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {isEvent && <span className="mr-1">📅</span>}{it.title}
                </p>
                <p className="text-xs text-gray-400">
                  {memberName(it.assigned_to ?? null) ?? 'Sem responsável'}
                  {dateTime && ` · ${dateTime}`}
                </p>
              </div>
              {isOverdue && <span className="text-xs font-semibold text-red-500 flex-shrink-0">Atrasada</span>}
            </li>
          )
        })}
      </ul>
    )
  }

  const VIEWS: { key: TaskView; label: string }[] = [
    { key: 'dia',    label: 'Dia'    },
    { key: 'semana', label: 'Semana' },
    { key: 'mes',    label: 'Mês'    },
    { key: 'ano',    label: 'Ano'    },
    { key: 'lista',  label: 'Lista'  },
  ]

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        emoji="🎯"
        title="Painel de Antecipação"
        description="O centro de comando da casa. Veja o que precisa de atenção hoje e o que vem a seguir."
      />

      {/* ══════════════════════════════════════════════════
          ZONA 1 — SEMÁFORO
      ══════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Situação geral — Hoje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Urgências */}
          <div className={`rounded-xl border p-4 ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <p className="text-xs text-gray-600 font-medium mb-1">Atenção Imediata</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-black ${overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overdueCount}
              </span>
              <span className="text-sm text-gray-500 mb-1">
                {overdueCount === 1 ? 'item atrasado' : 'itens atrasados'}
              </span>
            </div>
            {todayCount > 0 && (
              <p className="text-xs text-yellow-700 mt-1 font-medium">
                + {todayCount} {todayCount === 1 ? 'vence hoje' : 'vencem hoje'}
              </p>
            )}
            {criticalRadar > 0 && (
              <p className="text-xs text-orange-600 mt-0.5 font-medium">
                {criticalRadar} críticos no radar
              </p>
            )}
          </div>

          {/* Orçamento */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium mb-1">Orçamento do Mês</p>
            {currentMonth ? (
              <>
                <p className="text-xl font-bold text-gray-800">R$ {currentMonth.balance.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Saldo restante projetado</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  <span>↑ R$ {(currentMonth.income ?? 0).toFixed(2)}</span>
                  <span>↓ R$ {(currentMonth.total_paid ?? 0).toFixed(2)}</span>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-2">Sem dados registados este mês.</p>
            )}
          </div>

          {/* Poupança */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500 font-medium mb-1">Foco de Poupança</p>
            {mainGoal ? (
              <>
                <p className="text-base font-bold text-gray-800 truncate">{mainGoal.title}</p>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((mainGoal.current_amount / mainGoal.target_amount) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  R$ {mainGoal.current_amount.toFixed(2)} de R$ {mainGoal.target_amount.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mt-2">Nenhum objetivo ativo.</p>
            )}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ZONA 2 — FOCO DO DIA + RADAR (lado a lado)
      ══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Foco do Dia */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-800">☀️ O Foco do Dia</h2>
            {todayCount > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{todayCount} hoje</span>
            )}
            {overdueCount > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{overdueCount} atrasados</span>
            )}
          </div>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {dashLoading ? (
              <div className="p-6 text-center text-gray-400 text-sm animate-pulse">A carregar...</div>
            ) : focusItems.length === 0 ? (
              <div className="p-8">
                <EmptyState emoji="✅" title="Tudo tranquilo!" description="Nenhuma pendência urgente para hoje." />
              </div>
            ) : (
              <ul className="divide-y">
                {focusItems.map(item => (
                  <li key={`${item.source}-${item.item_id}`} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">{SOURCE_ICONS[item.source] ?? '📌'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.title}</p>
                      {item.subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>}
                    </div>
                    {item.urgency === 'overdue' && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 px-2 py-1 rounded">Atrasado</span>
                    )}
                    {item.urgency === 'today' && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Vence Hoje</span>
                    )}
                    {item.urgency === 'running_out' && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 px-2 py-1 rounded">Urgente</span>
                    )}
                    {item.urgency === 'due_soon' && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-1 rounded">Em breve</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Radar 90 Dias */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-800">📡 Radar de 90 Dias</h2>
            {criticalRadar > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{criticalRadar} críticos</span>
            )}
          </div>
          <div className="bg-[#1A237E] rounded-xl shadow-sm overflow-hidden border border-[#283593]">
            {dashLoading ? (
              <div className="p-6 text-center text-blue-200 text-sm animate-pulse">A carregar...</div>
            ) : radarItems.length === 0 ? (
              <div className="p-8 bg-white/5">
                <EmptyState emoji="📡" title="Radar Limpo" description="Nenhum evento nos próximos 3 meses." />
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {radarItems.map(item => {
                  const isCritical = item.urgency_score === 1 || item.days_until <= 7
                  return (
                    <li key={`${item.source}-${item.item_id}`} className={`p-4 flex items-center gap-3 ${isCritical ? 'bg-red-500/20' : 'hover:bg-white/5'}`}>
                      <span className="text-xl flex-shrink-0">{SOURCE_ICONS[item.source] ?? '🎯'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${isCritical ? 'text-white' : 'text-blue-50'}`}>{item.title}</p>
                        <p className="text-xs text-blue-200 mt-0.5">
                          {new Date(item.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${isCritical ? 'text-red-300' : 'text-blue-200'}`}>{item.days_until}d</p>
                        {item.urgency_score === 1 && (
                          <p className="text-[10px] text-red-300 font-bold uppercase tracking-wide">crítico</p>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </section>

      </div>

      {/* ══════════════════════════════════════════════════
          ZONA 3 — CALENDÁRIO DE TAREFAS
      ══════════════════════════════════════════════════ */}
      <section>
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap">
            <h2 className="font-semibold text-gray-800">📅 Agendamentos</h2>
            <div className="flex rounded-lg border overflow-hidden text-xs font-medium">
              {VIEWS.map(v => (
                <button
                  key={v.key}
                  onClick={() => switchView(v.key)}
                  className={`px-3 py-1.5 transition-colors border-r last:border-r-0
                    ${taskView === v.key ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          {taskView === 'dia'    && <ViewDia/>}
          {taskView === 'semana' && <ViewSemana/>}
          {taskView === 'mes'    && <ViewMes/>}
          {taskView === 'ano'    && <ViewAno/>}
          {taskView === 'lista'  && <ViewLista/>}
        </div>
      </section>

    </div>
  )
}
