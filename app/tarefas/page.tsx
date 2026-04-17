'use client'

import { useState, useMemo } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useTasks } from '@/hooks/useTasks'
import { useEmotionalCheckins } from '@/hooks/useEmotionalCheckins'
import { useFamilyEvents } from '@/hooks/useFamilyEvents'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskSheet } from '@/components/sheets/TaskSheet'
import { CheckinSheet } from '@/components/sheets/CheckinSheet'
import { EventSheet } from '@/components/sheets/EventSheet'
import { formatTaskDateTime } from '@/lib/formatDateTime'
import { formatDate } from '@/lib/utils'
import type { Task, FamilyEvent } from '@/types/database'

// ─── helpers ────────────────────────────────────────────────────────────────

const WEEKDAYS_SHORT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const WEEKDAYS_LONG  = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
const MONTHS_PT      = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_SHORT   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const HOURS          = Array.from({length:18},(_,i)=>i+6) // 06h–23h

const PRIORITY_DOT: Record<string,string> = {
  high:'bg-red-500', medium:'bg-yellow-400', low:'bg-green-400',
  '3':'bg-red-500',  '2':'bg-yellow-400',    '1':'bg-green-400',
}

function dayOnly(d: Date) { const r=new Date(d); r.setHours(0,0,0,0); return r }
function addDays(d: Date, n: number) { const r=new Date(d); r.setDate(r.getDate()+n); return r }
function toISO(d: Date) { return d.toISOString().slice(0,10) }
function sameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate()
}
function startOfWeek(d: Date) { const r=dayOnly(d); r.setDate(r.getDate()-r.getDay()); return r }
function getDaysInMonth(y: number, m: number) { return new Date(y,m+1,0).getDate() }

type ViewType = 'dia' | 'semana' | 'mes' | 'ano' | 'lista'

// ─── NavBar ────────────────────────────────────────────────────────────────
function NavBar({ label, onPrev, onNext, onToday, showToday }: {
  label: string; onPrev:()=>void; onNext:()=>void; onToday:()=>void; showToday: boolean
}) {
  return (
    <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50">
      <button onClick={onPrev} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors text-xl font-light">‹</button>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {showToday && (
          <button onClick={onToday} className="text-xs text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded px-1.5 py-0.5">Hoje</button>
        )}
      </div>
      <button onClick={onNext} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors text-xl font-light">›</button>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
export default function TarefasPage() {
  const { currentFamily, members, currentUser } = useFamilyStore()
  const { tasks, isLoading, upsert, complete, remove } = useTasks()
  const { addCheckin, weekMoodAverage } = useEmotionalCheckins(currentFamily?.id ?? null)
  const { events, upsert: upsertEvent, toggleDone, remove: removeEvent } = useFamilyEvents(currentFamily?.id ?? null)

  const [taskOpen, setTaskOpen]         = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [checkinOpen, setCheckinOpen]   = useState(false)
  const [view, setView]                 = useState<ViewType>('semana')
  const [offset, setOffset]             = useState(0)
  const [eventOpen, setEventOpen]       = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<FamilyEvent | null>(null)

  const today  = useMemo(() => dayOnly(new Date()), [])

  function openNew(prefill?: Partial<Task>) { setSelectedTask(prefill as Task ?? null); setTaskOpen(true) }
  function openEdit(t: Task) { setSelectedTask(t); setTaskOpen(true) }
  function switchView(v: ViewType) { setView(v); setOffset(0) }

  function handleComplete(t: Task) {
    if (t.status !== 'done') complete(t.id, t.requires_supervision ? currentUser?.id : undefined)
  }

  const memberName = (id: string | null | undefined) => {
    if (!id) return null
    const m = members.find(m => m.id === id)
    return m?.nickname ?? (m as any)?.name ?? null
  }

  const moodEmoji = (avg: number | null) => {
    if (avg === null) return '—'
    if (avg >= 4.5) return '😄'
    if (avg >= 3.5) return '🙂'
    if (avg >= 2.5) return '😐'
    if (avg >= 1.5) return '😔'
    return '😢'
  }

  // tarefas por dia
  const tasksForDay = (day: Date) =>
    tasks.filter(t => {
      const due = (t as any).due_date as string | null
      if (!due) return false
      return sameDay(dayOnly(new Date(due)), day)
    }).sort((a,b) => ((a as any).due_time??'').localeCompare((b as any).due_time??''))

  const noDateTasks = tasks.filter(t => !(t as any).due_date)

  // ─── TaskCard ───────────────────────────────────────────────────────────
  function TaskCard({ t, compact = false }: { t: Task; compact?: boolean }) {
    const checklist = Array.isArray(t.checklist) ? t.checklist : []
    const doneCk    = checklist.filter((i:any) => i.done).length
    const overdue   = (t as any).due_date && dayOnly(new Date((t as any).due_date)) < today && t.status !== 'done'
    const time      = (t as any).due_time ? (t as any).due_time.slice(0,5) : null
    const dot       = PRIORITY_DOT[String((t as any).priority)] ?? 'bg-gray-300'

    if (compact) {
      return (
        <div
          onClick={() => openEdit(t)}
          className={`rounded-lg px-2 py-1.5 cursor-pointer border text-xs leading-tight transition-all
            ${t.status==='done' ? 'bg-gray-50 border-gray-200 opacity-60'
              : overdue         ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-200 hover:border-teal-400 hover:shadow-sm'}`}
        >
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); handleComplete(t) }}
              className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center
                ${t.status==='done' ? 'bg-teal-500 border-teal-500' : 'border-gray-300 hover:border-teal-400'}`}
            >
              {t.status==='done' && (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className={`font-medium truncate ${t.status==='done' ? 'line-through text-gray-400' : ''}`}>{t.title}</span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
          </div>
          {(time || memberName(t.assigned_to)) && (
            <p className="text-gray-400 mt-0.5 truncate pl-5">
              {time && <span className="font-medium text-gray-500">{time} </span>}
              {memberName(t.assigned_to)}
            </p>
          )}
          {checklist.length > 0 && (
            <p className={`mt-0.5 pl-5 text-[10px] ${doneCk===checklist.length?'text-green-500':'text-gray-400'}`}>
              ✓ {doneCk}/{checklist.length}
            </p>
          )}
        </div>
      )
    }

    // lista
    return (
      <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
        <input type="checkbox" checked={t.status==='done'} onChange={()=>handleComplete(t)}
          className="w-4 h-4 accent-teal-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${t.status==='done'?'line-through text-gray-400':''}`}>{t.title}</p>
          <p className="text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {memberName(t.assigned_to) && <span>{memberName(t.assigned_to)}</span>}
            {(t as any).due_date && <span>📅 {formatTaskDateTime((t as any).due_date,(t as any).due_time)}</span>}
            {overdue && <span className="text-red-500 font-medium">Atrasada</span>}
            {t.requires_supervision && <span>👤 Requer adulto</span>}
            {checklist.length>0 && <span className={doneCk===checklist.length?'text-green-500':''}>✅ {doneCk}/{checklist.length}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="text-xs text-gray-400 hover:text-gray-600" onClick={()=>openEdit(t)}>Editar</button>
          <button className="text-xs text-red-400 hover:text-red-600" onClick={()=>remove(t.id)}>×</button>
        </div>
      </li>
    )
  }

  // ─── VIEW: DIA ─────────────────────────────────────────────────────────────
  function ViewDia() {
    const currentDay = addDays(today, offset)
    const isToday    = sameDay(currentDay, today)
    const dayTasks   = tasksForDay(currentDay)
    const withTime   = dayTasks.filter(t => (t as any).due_time)
    const noTime     = dayTasks.filter(t => !(t as any).due_time)
    const nowHour    = new Date().getHours()
    const label      = isToday
      ? 'Hoje — ' + currentDay.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'})
      : currentDay.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})

    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <NavBar label={label} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>

        {/* Dia todo */}
        {noTime.length>0 && (
          <div className="px-3 py-2 border-b bg-teal-50/40 flex flex-wrap gap-1 items-center">
            <span className="text-[10px] text-teal-700 font-semibold uppercase tracking-wide mr-1">Dia todo</span>
            {noTime.map(t=><div key={t.id} className="max-w-[200px]"><TaskCard t={t} compact/></div>)}
          </div>
        )}

        {/* Slots de hora */}
        <div className="overflow-y-auto max-h-[480px] divide-y">
          {HOURS.map(h => {
            const slotTasks = withTime.filter(t => {
              const [th] = ((t as any).due_time??'').split(':').map(Number)
              return th === h
            })
            const isCurrentHour = isToday && nowHour === h
            return (
              <div key={h} className={`flex min-h-[52px] ${isCurrentHour?'bg-teal-50':''}`}>
                <div className="w-14 flex-shrink-0 text-[11px] text-gray-400 font-medium pt-2 pl-3 select-none">
                  {String(h).padStart(2,'0')}:00
                </div>
                <div className="flex-1 p-1.5 flex flex-col gap-1">
                  {slotTasks.map(t=><TaskCard key={t.id} t={t} compact/>)}
                </div>
                <button
                  onClick={()=>openNew({ due_date: toISO(currentDay), due_time: `${String(h).padStart(2,'0')}:00` } as any)}
                  className="w-6 flex-shrink-0 text-gray-200 hover:text-teal-400 text-sm self-start pt-1.5 transition-colors"
                  title={`Nova tarefa às ${h}h`}
                >+</button>
              </div>
            )
          })}
        </div>

        {dayTasks.length===0 && (
          <div className="p-10 text-center text-gray-400 text-sm">Nenhuma tarefa para este dia.</div>
        )}
      </div>
    )
  }

  // ─── VIEW: SEMANA ───────────────────────────────────────────────────────────
  function ViewSemana() {
    const weekStart = addDays(startOfWeek(today), offset*7)
    const weekDays  = Array.from({length:7},(_,i)=>addDays(weekStart,i))
    const end       = weekDays[6]
    const fmt       = (d:Date)=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})
    const label     = `${fmt(weekStart)} – ${fmt(end)}`

    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <NavBar label={label} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[560px]">
            {/* cabeçalho */}
            {weekDays.map((d,i)=>{
              const isToday2 = sameDay(d,today)
              const isPast   = d<today && !isToday2
              const hasTasks = tasksForDay(d).some(t=>t.status!=='done')
              return (
                <div key={i} className={`px-2 py-2 border-b border-r last:border-r-0 text-center ${isToday2?'bg-teal-50':'bg-gray-50'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isToday2?'text-teal-700':isPast?'text-gray-400':'text-gray-500'}`}>{WEEKDAYS_SHORT[i]}</p>
                  <p className={`text-lg font-bold leading-tight ${isToday2?'text-teal-600':isPast?'text-gray-300':'text-gray-700'}`}>{d.getDate()}</p>
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-0.5 ${hasTasks?(isToday2?'bg-teal-400':'bg-gray-400'):'bg-transparent'}`}/>
                </div>
              )
            })}
            {/* células */}
            {weekDays.map((d,i)=>{
              const isToday2 = sameDay(d,today)
              const dt = tasksForDay(d)
              return (
                <div key={i} className={`border-r last:border-r-0 p-1.5 min-h-[140px] ${isToday2?'bg-teal-50/30':''}`}>
                  <div className="space-y-1">
                    {dt.map(t=><TaskCard key={t.id} t={t} compact/>)}
                    {dt.length===0 && <p className="text-xs text-gray-300 text-center pt-4">—</p>}
                  </div>
                  <button
                    onClick={()=>openNew({due_date:toISO(d)} as any)}
                    className="mt-1 w-full text-xs text-gray-300 hover:text-teal-500 hover:bg-teal-50 rounded py-0.5 transition-colors"
                    title={`Nova tarefa em ${WEEKDAYS_LONG[i]}`}
                  >+</button>
                </div>
              )
            })}
          </div>
        </div>
        {noDateTasks.length>0 && (
          <div className="border-t px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sem data</p>
            <div className="flex flex-wrap gap-1.5">
              {noDateTasks.map(t=><div key={t.id} className="max-w-[200px]"><TaskCard t={t} compact/></div>)}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── VIEW: MÊS ────────────────────────────────────────────────────────────
  function ViewMes() {
    const monthDate   = new Date(today.getFullYear(), today.getMonth()+offset, 1)
    const yr          = monthDate.getFullYear()
    const mi          = monthDate.getMonth()
    const dInM        = getDaysInMonth(yr,mi)
    const firstDow    = new Date(yr,mi,1).getDay()
    const label       = `${MONTHS_PT[mi]} ${yr}`

    const cells: (Date|null)[] = [
      ...Array(firstDow).fill(null),
      ...Array.from({length:dInM},(_,i)=>new Date(yr,mi,i+1))
    ]
    while(cells.length%7!==0) cells.push(null)

    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <NavBar label={label} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS_SHORT.map(d=>(
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1.5">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x">
          {cells.map((day,i)=>{
            if(!day) return <div key={i} className="border-b bg-gray-50/40 min-h-[80px]"/>
            const isToday2 = sameDay(day,today)
            const isPast   = day<today && !isToday2
            const dt = tasksForDay(day)
            const visible = dt.slice(0,3)
            const extra   = dt.length-visible.length
            return (
              <div key={i} className={`border-b min-h-[80px] flex flex-col p-0.5 ${isToday2?'bg-teal-50':isPast?'bg-gray-50/40':'bg-white'}`}>
                <div className={`text-[11px] font-bold self-end w-5 h-5 flex items-center justify-center rounded-full mb-0.5
                  ${isToday2?'bg-teal-600 text-white':'text-gray-500'}`}>{day.getDate()}</div>
                <div className="space-y-0.5 flex-1 overflow-hidden">
                  {visible.map(t=><TaskCard key={t.id} t={t} compact/>)}
                  {extra>0 && <div className="text-[10px] text-gray-400 font-medium pl-1">+{extra} mais</div>}
                </div>
                <button
                  onClick={()=>openNew({due_date:toISO(day)} as any)}
                  className="text-[10px] text-gray-300 hover:text-teal-500 transition-colors mt-0.5"
                  title="Nova tarefa"
                >+</button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── VIEW: ANO (heatmap) ────────────────────────────────────────────────────────
  const dayCountMap = useMemo(()=>{
    const map: Record<string,number>={}
    tasks.forEach(t=>{
      if(!(t as any).due_date) return
      const key=(t as any).due_date.slice(0,10)
      map[key]=(map[key]??0)+1
    })
    return map
  },[tasks])

  function heatColor(n:number){
    if(n===0) return 'bg-gray-100'
    if(n===1) return 'bg-teal-200'
    if(n===2) return 'bg-teal-300'
    if(n<=4)  return 'bg-teal-500'
    return 'bg-teal-700'
  }

  function ViewAno() {
    const anoYear = today.getFullYear()+offset
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        <NavBar label={String(anoYear)} onPrev={()=>setOffset(o=>o-1)} onNext={()=>setOffset(o=>o+1)} onToday={()=>setOffset(0)} showToday={offset!==0}/>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {MONTHS_SHORT.map((mName,mIdx)=>{
            const dInM   = getDaysInMonth(anoYear,mIdx)
            const firstD = new Date(anoYear,mIdx,1).getDay()
            const cells: (number|null)[] = [...Array(firstD).fill(null),...Array.from({length:dInM},(_,i)=>i+1)]
            while(cells.length%7!==0) cells.push(null)
            return (
              <div key={mIdx}>
                <p className="text-xs font-semibold text-gray-600 mb-1.5">{mName}</p>
                <div className="grid grid-cols-7 gap-px">
                  {WEEKDAYS_SHORT.map(d=>(
                    <div key={d} className="text-[8px] text-gray-300 text-center">{d[0]}</div>
                  ))}
                  {cells.map((day,ci)=>{
                    if(!day) return <div key={ci}/>
                    const key=`${anoYear}-${String(mIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    const cnt=dayCountMap[key]??0
                    const isT=today.getFullYear()===anoYear && today.getMonth()===mIdx && today.getDate()===day
                    return (
                      <div
                        key={ci}
                        title={cnt>0?`${day}/${mIdx+1}: ${cnt} tarefa${cnt>1?'s':''}`:`${day}/${mIdx+1}`}
                        onClick={()=>{
                          const d=new Date(anoYear,mIdx,day)
                          switchView('dia')
                          setOffset(Math.round((d.getTime()-today.getTime())/(1000*60*60*24)))
                        }}
                        className={`w-full aspect-square rounded-sm cursor-pointer hover:opacity-70 transition-opacity ${isT?'ring-1 ring-teal-600':''} ${heatColor(cnt)}`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-4 pb-4 flex items-center gap-2 text-[10px] text-gray-400">
          <span>Menos</span>
          {['bg-gray-100','bg-teal-200','bg-teal-300','bg-teal-500','bg-teal-700'].map(c=>(
            <span key={c} className={`w-3 h-3 rounded-sm ${c}`}/>
          ))}
          <span>Mais tarefas</span>
          <span className="ml-4 text-gray-300">• Clique em um dia para abrir visão diária</span>
        </div>
      </div>
    )
  }

  // ─── VIEW: LISTA ────────────────────────────────────────────────────────────
  function ViewLista() {
    const unassigned = tasks.filter(t=>!t.assigned_to)
    return (
      <>
        {unassigned.length>0 && (
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-500">📋 Sem responsável</h3>
            </div>
            <ul className="divide-y">{unassigned.map(t=><TaskCard key={t.id} t={t}/>)}</ul>
          </div>
        )}
        {members.map(m=>{
          const mt=tasks.filter(t=>t.assigned_to===m.id)
          if(mt.length===0) return null
          return (
            <div key={m.id} className="rounded-xl border bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:m.color_hex??'#4A90D9'}}/>
                <h3 className="font-semibold text-gray-700">{m.nickname??(m as any).name}</h3>
                <span className="text-xs text-gray-400 ml-auto">{mt.filter(t=>t.status==='done').length}/{mt.length} feitas</span>
              </div>
              <ul className="divide-y">{mt.map(t=><TaskCard key={t.id} t={t}/>)}</ul>
            </div>
          )
        })}
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <PageHeader
        emoji="✅"
        title="Tarefas"
        description="Organize e acompanhe as tarefas da família"
        action={
          <div className="flex gap-2">
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={() => { setCheckinOpen(true) }}
            >
              😊 Check-in
            </button>
            <button
              className="text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 font-medium"
              onClick={() => openNew()}
            >
              + Nova tarefa
            </button>
          </div>
        }
      />

      {/* Seletor de visão */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['dia','semana','mes','ano','lista'] as ViewType[]).map(v=>(
          <button
            key={v}
            onClick={()=>switchView(v)}
            className={`px-3 py-1 rounded-md text-sm font-medium capitalize transition-colors
              ${view===v ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {v==='dia'?'Dia':v==='semana'?'Semana':v==='mes'?'Mês':v==='ano'?'Ano':'Lista'}
          </button>
        ))}
      </div>

      {/* Visões */}
      {view==='dia'    && <ViewDia/>}
      {view==='semana' && <ViewSemana/>}
      {view==='mes'    && <ViewMes/>}
      {view==='ano'    && <ViewAno/>}
      {view==='lista'  && <ViewLista/>}

      {/* Eventos e prazos */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">📅 Eventos e prazos</h2>
          <button
            className="text-sm text-teal-600 font-medium hover:underline"
            onClick={() => { setSelectedEvent(null); setEventOpen(true) }}
          >
            + Adicionar
          </button>
        </div>
        {events.length === 0 ? (
          <EmptyState title="Nenhum evento" description="Cadastre datas importantes, viagens, consultas e aniversários." />
        ) : (
          <ul className="divide-y">
            {events.map(e => (
              <li
                key={e.id}
                className={`px-4 py-3 flex items-center gap-3 hover:bg-gray-50 ${e.is_done ? 'opacity-50' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={!!e.is_done}
                  onChange={() => toggleDone(e.id, !!e.is_done)}
                  className="w-4 h-4 accent-teal-600"
                />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${e.is_done ? 'line-through text-gray-400' : ''}`}>
                    {e.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDate(e.event_date)}
                    {e.daysLeft !== null && (
                      <> &middot; {e.daysLeft < 0 ? `${Math.abs(e.daysLeft)}d atrás` : `em ${e.daysLeft}d`}</>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-xs text-gray-400 hover:text-gray-600"
                    onClick={() => { setSelectedEvent(e); setEventOpen(true) }}
                  >
                    Editar
                  </button>
                  <button
                    className="text-xs text-red-400 hover:text-red-600"
                    onClick={() => removeEvent(e.id)}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TaskSheet open={taskOpen} onClose={() => setTaskOpen(false)} task={selectedTask} onSave={upsert} members={members} />
      <CheckinSheet open={checkinOpen} onClose={() => setCheckinOpen(false)} onSave={addCheckin} familyId={currentFamily?.id ?? ''} />
      <EventSheet
        open={eventOpen}
        onClose={() => setEventOpen(false)}
        event={selectedEvent}
        onSave={upsertEvent}
        familyId={currentFamily?.id ?? ''}
        members={members}
      />
    </div>
  )
}
