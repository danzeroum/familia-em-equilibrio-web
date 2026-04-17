'use client'

import { useState, useMemo } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useRadarItems } from '@/hooks/useRadarItems'
import { useBills } from '@/hooks/useBills'
import { useTasks } from '@/hooks/useTasks'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { formatTaskDateTime } from '@/lib/formatDateTime'

// ─── helpers ────────────────────────────────────────────────────────────────

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

function noon(d: Date) {
  const r = new Date(d); r.setHours(12,0,0,0); return r
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

// ─── TaskCard compacto ───────────────────────────────────────────────────────

function TaskChip({ t, memberName }: { t: any; memberName: (id: string|null)=>string|null }) {
  const today = dayOnly(new Date())
  const isOverdue = t.due_date && dayOnly(new Date(t.due_date)) < today
  const priority = t.priority ?? 'low'
  const time = t.due_time
  const name = memberName(t.assigned_to)
  return (
    <div
      title={t.title}
      className={`rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer hover:opacity-75 transition-opacity
        ${isOverdue ? 'bg-red-100 text-red-800' : `bg-white shadow-sm text-gray-700 ${PRIORITY_CARD[priority] ?? ''}`}`}
    >
      <div className="flex items-center gap-1">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[priority] ?? 'bg-gray-300'}`} />
        <span className="font-medium truncate">{t.title}</span>
      </div>
      {(time || name) && (
        <div className="text-gray-400 truncate mt-0.5">
          {time && <span>{time.slice(0,5)}</span>}
          {time && name && <span> · </span>}
          {name && <span>{name}</span>}
        </div>
      )}
    </div>
  )
}

// ─── Nav bar ─────────────────────────────────────────────────────────────────

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
  const { currentFamily, members } = useFamilyStore()
  const { items, counts, isLoading } = useRadarItems(currentFamily?.id ?? null)
  const { bills, totalMonthly } = useBills()
  const { tasks } = useTasks()

  const [taskView, setTaskView] = useState<TaskView>('semana')
  const [offset, setOffset] = useState(0)   // dia+/semana+/mes+/ano+ offset

  const today = useMemo(() => dayOnly(new Date()), [])

  const allPending = useMemo(() => tasks.filter(t => t.status !== 'done'), [tasks])

  const memberName = (id: string | null) => {
    if (!id) return null
    const m = members.find(m => m.id === id)
    return m?.nickname ?? m?.name ?? null
  }

  const tasksForDay = (day: Date) =>
    allPending.filter(t => {
      if (!t.due_date) return false
      return sameDay(dayOnly(new Date(t.due_date)), day)
    }).sort((a,b) => ((a as any).due_time??'').localeCompare((b as any).due_time??''))

  const tasksNoDate = allPending.filter(t => !t.due_date)

  // lista: próximos 7 dias
  const in7 = addDays(today, 7)
  const weekTasks = allPending.filter(t => {
    if (!t.due_date) return true
    const d = dayOnly(new Date(t.due_date))
    return d <= in7
  }).sort((a,b) => {
    if (!a.due_date) return 1; if (!b.due_date) return -1
    const dc = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    return dc !== 0 ? dc : ((a as any).due_time??'').localeCompare((b as any).due_time??'')
  })

  const focusDo = items.filter(i => i.priority==='urgent' || i.priority==='overdue').slice(0,3)

  // reset offset when switching views
  function switchView(v: TaskView) { setTaskView(v); setOffset(0) }

  // ── VIEW: DIA ──────────────────────────────────────────────────────────────
  const currentDay = addDays(today, offset)
  const HOURS = Array.from({length:18},(_,i)=>i+6)  // 06h–23h

  function ViewDia() {
    const dayTasks = tasksForDay(currentDay)
    const withTime = dayTasks.filter(t => (t as any).due_time)
    const noTime   = dayTasks.filter(t => !(t as any).due_time)
    const isToday  = sameDay(currentDay, today)
    const label    = isToday ? 'Hoje' : currentDay.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})

    return (
      <div>
        <NavBar
          label={label}
          onPrev={()=>setOffset(o=>o-1)}
          onNext={()=>setOffset(o=>o+1)}
          onToday={()=>setOffset(0)}
          showToday={offset!==0}
        />
        {/* Dia todo */}
        {noTime.length>0 && (
          <div className="px-3 py-2 border-b bg-gray-50 flex flex-wrap gap-1 items-center">
            <span className="text-[10px] text-gray-400 font-semibold mr-1 uppercase tracking-wide">Dia todo</span>
            {noTime.map(t=><TaskChip key={t.id} t={t} memberName={memberName}/>)}
          </div>
        )}
        {/* Slots de hora */}
        <div className="overflow-y-auto max-h-[420px]">
          {HOURS.map(h=>{
            const slotTasks = withTime.filter(t=>{
              const [th] = ((t as any).due_time??'').split(':').map(Number)
              return th===h
            })
            return (
              <div key={h} className={`flex border-b min-h-[44px] ${isToday && new Date().getHours()===h ? 'bg-teal-50' : ''}`}>
                <div className="w-12 flex-shrink-0 text-[10px] text-gray-400 font-medium pt-1 pl-3">{String(h).padStart(2,'0')}h</div>
                <div className="flex-1 p-1 flex flex-col gap-0.5">
                  {slotTasks.map(t=><TaskChip key={t.id} t={t} memberName={memberName}/>)}
                </div>
              </div>
            )
          })}
        </div>
        {dayTasks.length===0 && (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhuma tarefa para este dia.</div>
        )}
      </div>
    )
  }

  // ── VIEW: SEMANA ───────────────────────────────────────────────────────────
  const weekStart = addDays(getWeekStart(today), offset*7)
  const weekDays  = Array.from({length:7},(_,i)=>addDays(weekStart,i))

  function ViewSemana() {
    const end = addDays(weekStart,6)
    const fmt = (d:Date)=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
    const label = `${fmt(weekStart)} – ${fmt(end)}`
    return (
      <div>
        <NavBar label={label} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        <div className="grid grid-cols-7 divide-x min-h-[180px]">
          {weekDays.map((day,idx)=>{
            const isToday = sameDay(day,today)
            const isPast  = day < today && !isToday
            const dt = tasksForDay(day)
            return (
              <div key={idx} className={`flex flex-col ${isToday?'bg-teal-50':isPast?'bg-gray-50/60':'bg-white'}`}>
                <div className="flex flex-col items-center pt-2 pb-1 border-b">
                  <span className={`text-[10px] font-semibold uppercase tracking-wide ${isToday?'text-teal-600':'text-gray-400'}`}>{WEEKDAYS_SHORT[day.getDay()]}</span>
                  <span className={`text-sm font-bold leading-none mt-0.5 ${isToday?'text-teal-600':isPast?'text-gray-300':'text-gray-700'}`}>{day.getDate()}</span>
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dt.length>0?(isToday?'bg-teal-500':'bg-gray-400'):'bg-transparent'}`}/>
                </div>
                <div className="flex-1 p-1 space-y-0.5 overflow-hidden">
                  {dt.map(t=><TaskChip key={t.id} t={t} memberName={memberName}/>)}
                </div>
              </div>
            )
          })}
        </div>
        {tasksNoDate.length>0 && (
          <div className="px-4 py-2 border-t bg-gray-50 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-gray-400 font-medium mr-1">Sem data:</span>
            {tasksNoDate.map(t=>(
              <span key={t.id} className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5 truncate max-w-[120px]" title={t.title}>{t.title}</span>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── VIEW: MÊS ─────────────────────────────────────────────────────────────
  const monthDate  = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const monthYear  = monthDate.getFullYear()
  const monthIdx   = monthDate.getMonth()
  const daysInMonth = getDaysInMonth(monthYear, monthIdx)
  const firstDow   = new Date(monthYear, monthIdx, 1).getDay()   // 0=Dom

  function ViewMes() {
    const label = `${MONTHS_PT[monthIdx]} ${monthYear}`
    const cells: (Date|null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({length:daysInMonth},(_,i)=>new Date(monthYear,monthIdx,i+1))
    ]
    // pad to complete last row
    while(cells.length % 7 !== 0) cells.push(null)

    return (
      <div>
        <NavBar label={label} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS_SHORT.map(d=>(
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
          ))}
        </div>
        {/* Células */}
        <div className="grid grid-cols-7 divide-x">
          {cells.map((day,i)=>{
            if(!day) return <div key={i} className="border-b bg-gray-50/40 min-h-[64px]"/>
            const isToday = sameDay(day,today)
            const isPast  = day < today && !isToday
            const dt = tasksForDay(day)
            const visible = dt.slice(0,2)
            const extra   = dt.length - visible.length
            return (
              <div key={i} className={`border-b min-h-[64px] flex flex-col p-0.5 ${isToday?'bg-teal-50':isPast?'bg-gray-50/40':'bg-white'}`}>
                <div className={`text-[11px] font-bold self-end w-5 h-5 flex items-center justify-center rounded-full mb-0.5
                  ${isToday?'bg-teal-600 text-white':'text-gray-500'}`}>{day.getDate()}</div>
                <div className="space-y-0.5 flex-1 overflow-hidden">
                  {visible.map(t=><TaskChip key={t.id} t={t} memberName={memberName}/>)}
                  {extra>0 && <div className="text-[10px] text-gray-400 font-medium pl-1">+{extra} mais</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── VIEW: ANO ─────────────────────────────────────────────────────────────
  const anoYear = today.getFullYear() + offset

  // mapa dia→count
  const dayCountMap = useMemo(()=>{
    const map: Record<string,number> = {}
    allPending.forEach(t=>{
      if(!t.due_date) return
      const key = t.due_date.slice(0,10)
      map[key] = (map[key]??0)+1
    })
    return map
  },[allPending])

  function heatColor(n: number) {
    if(n===0) return 'bg-gray-100'
    if(n===1) return 'bg-teal-200'
    if(n===2) return 'bg-teal-400'
    if(n<=4)  return 'bg-teal-500'
    return 'bg-teal-700'
  }

  function ViewAno() {
    return (
      <div>
        <NavBar label={String(anoYear)} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {MONTHS_SHORT.map((mName,mIdx)=>{
            const dInM = getDaysInMonth(anoYear, mIdx)
            const firstD = new Date(anoYear, mIdx, 1).getDay()
            const cells: (number|null)[] = [...Array(firstD).fill(null), ...Array.from({length:dInM},(_,i)=>i+1)]
            while(cells.length%7!==0) cells.push(null)
            return (
              <div key={mIdx}>
                <div className="text-xs font-semibold text-gray-600 mb-1">{mName}</div>
                <div className="grid grid-cols-7 gap-px">
                  {WEEKDAYS_SHORT.map(d=>(
                    <div key={d} className="text-[8px] text-gray-300 text-center">{d[0]}</div>
                  ))}
                  {cells.map((day,ci)=>{
                    if(!day) return <div key={ci}/>
                    const key = `${anoYear}-${String(mIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    const cnt = dayCountMap[key]??0
                    const isT = today.getFullYear()===anoYear && today.getMonth()===mIdx && today.getDate()===day
                    return (
                      <div
                        key={ci}
                        title={cnt>0?`${day}/${mIdx+1}: ${cnt} tarefa${cnt>1?'s':''}`:`${day}/${mIdx+1}`}
                        className={`w-full aspect-square rounded-sm ${isT?'ring-1 ring-teal-600':''} ${heatColor(cnt)} cursor-default`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {/* legenda */}
        <div className="px-4 pb-3 flex items-center gap-2 text-[10px] text-gray-400">
          <span>Menos</span>
          {['bg-gray-100','bg-teal-200','bg-teal-400','bg-teal-500','bg-teal-700'].map(c=>(
            <span key={c} className={`w-3 h-3 rounded-sm ${c}`}/>
          ))}
          <span>Mais</span>
        </div>
      </div>
    )
  }

  // ── VIEW: LISTA ────────────────────────────────────────────────────────────
  function ViewLista() {
    return weekTasks.length===0 ? (
      <div className="p-6 text-center text-gray-400 text-sm">Nenhuma tarefa pendente para os próximos 7 dias.</div>
    ) : (
      <ul className="divide-y">
        {weekTasks.map(t=>{
          const isOverdue = t.due_date && dayOnly(new Date(t.due_date)) < today
          const dateTime  = formatTaskDateTime((t as any).due_date,(t as any).due_time)
          return (
            <li key={t.id} className="px-4 py-3 flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue?'bg-red-500':'bg-teal-500'}`}/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs text-gray-400">
                  {memberName(t.assigned_to)??'Sem responsável'}
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

  // ─── toggle labels ─────────────────────────────────────────────────────────
  const VIEWS: { key: TaskView; label: string }[] = [
    { key: 'dia',    label: 'Dia'    },
    { key: 'semana', label: 'Semana' },
    { key: 'mes',    label: 'Mês'    },
    { key: 'ano',    label: 'Ano'    },
    { key: 'lista',  label: 'Lista'  },
  ]

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader title="🎯 Painel" subtitle="Visão geral da família" />

      {/* Semáforo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SemaforoCard label="🔴 Urgente"  value={counts.urgent}    color="text-red-600 bg-red-50"     />
        <SemaforoCard label="🟡 Atenção"  value={counts.attention} color="text-yellow-600 bg-yellow-50"/>
        <SemaforoCard label="🟢 Planejado" value={counts.planned}   color="text-green-600 bg-green-50" />
        <SemaforoCard label="✅ Feito"     value={counts.done}      color="text-gray-600 bg-gray-50"   />
      </div>

      {/* Foco do dia */}
      {focusDo.length>0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-700 mb-3">🚨 Foco do dia</h2>
          <ul className="space-y-2">
            {focusDo.map(i=>(
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-red-800">{i.category}</span>
                <span className="text-gray-700">{i.title}</span>
                <span className="ml-auto text-red-600 font-bold">
                  {i.daysLeft!==null && i.daysLeft<0 ? `${Math.abs(i.daysLeft)}d atraso` : `${i.daysLeft}d`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seção de tarefas com multi-view */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-semibold">📅 Tarefas</h2>
          <div className="flex rounded-lg border overflow-hidden text-xs font-medium">
            {VIEWS.map(v=>(
              <button
                key={v.key}
                onClick={()=>switchView(v.key)}
                className={`px-3 py-1.5 transition-colors border-r last:border-r-0
                  ${taskView===v.key ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Views */}
        {taskView==='dia'    && <ViewDia/>}
        {taskView==='semana' && <ViewSemana/>}
        {taskView==='mes'    && <ViewMes/>}
        {taskView==='ano'    && <ViewAno/>}
        {taskView==='lista'  && <ViewLista/>}
      </div>

      {/* Radar */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">📡 Radar — próximos 90 dias</h2>
          <span className="text-sm text-gray-500">{items.length} itens</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : items.length===0 ? (
          <EmptyState title="Radar limpo" description="Nenhum evento ou alerta nos próximos 90 dias." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Categoria</th>
                  <th className="px-4 py-2 text-left">Título</th>
                  <th className="px-4 py-2 text-left">Ação</th>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Dias</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map(i=>(
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{i.category}</td>
                    <td className="px-4 py-2 font-medium">{i.title}</td>
                    <td className="px-4 py-2 text-gray-500">{i.action}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{i.eventDate ? formatDate(i.eventDate) : '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`font-bold ${
                        i.daysLeft!==null && i.daysLeft<0  ? 'text-red-600'    :
                        i.daysLeft!==null && i.daysLeft<=7 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {i.daysLeft!==null ? (i.daysLeft<0 ? `${Math.abs(i.daysLeft)}d atrás` : `${i.daysLeft}d`) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2"><StatusBadge label={i.status} priority={i.priority} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumo financeiro */}
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-2">💳 Resumo do mês</h2>
        <p className="text-2xl font-bold text-gray-800">R$ {totalMonthly.toFixed(2)}</p>
        <p className="text-sm text-gray-500">{bills.filter(b=>b.status==='pending').length} contas pendentes</p>
      </div>
    </div>
  )
}

function SemaforoCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}
