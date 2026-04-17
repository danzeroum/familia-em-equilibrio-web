'use client'

import { useState, useMemo } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useTasks } from '@/hooks/useTasks'
import { useEmotionalCheckins } from '@/hooks/useEmotionalCheckins'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskSheet } from '@/components/sheets/TaskSheet'
import { CheckinSheet } from '@/components/sheets/CheckinSheet'
import { formatTaskDateTime } from '@/lib/formatDateTime'
import type { Task } from '@/types/database'

// ─── helpers ────────────────────────────────────────────────────────────────

/** Retorna o domingo da semana que contém `ref` */
function startOfWeek(ref: Date): Date {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // domingo = 0
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKDAY_LONG  = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

// ─── componente principal ────────────────────────────────────────────────────

export default function SemanaPage() {
  const { currentFamily, members } = useFamilyStore()
  const { tasks, isLoading, upsert, complete, remove } = useTasks()
  const { addCheckin, weekMoodAverage } = useEmotionalCheckins(currentFamily?.id ?? null)

  const [taskOpen, setTaskOpen]       = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [checkinOpen, setCheckinOpen] = useState(false)
  const [view, setView]               = useState<'lista' | 'agenda'>('lista')
  const [weekOffset, setWeekOffset]   = useState(0) // semanas relativas a hoje

  const adults = members.filter(m => (m as any).role === 'adult')

  // semana exibida
  const weekStart = useMemo(() => {
    const base = new Date()
    base.setDate(base.getDate() + weekOffset * 7)
    return startOfWeek(base)
  }, [weekOffset])

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])

  // label do período: "13 a 19 de abr"
  const weekLabel = useMemo(() => {
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', opts).replace('.', '')
    return `${fmt(weekStart)} – ${fmt(weekDays[6])}`
  }, [weekStart, weekDays])

  // ── mapa dia → tarefas ──
  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {}
    weekDays.forEach(d => { map[toISODate(d)] = [] })

    tasks.forEach(t => {
      const due = (t as any).due_date as string | null
      if (!due) return
      if (map[due]) map[due].push(t)
    })
    // ordena por hora dentro de cada dia
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => ((a as any).due_time ?? '').localeCompare((b as any).due_time ?? ''))
    )
    return map
  }, [tasks, weekDays])

  // tarefas sem data (só aparecem na lista)
  const noDateTasks = useMemo(() => tasks.filter(t => !(t as any).due_date), [tasks])

  // ── ações ──
  function openNew() { setSelectedTask(null); setTaskOpen(true) }
  function openEdit(t: Task) { setSelectedTask(t); setTaskOpen(true) }

  function handleComplete(t: Task) {
    if (t.status !== 'done') {
      complete(t.id, t.requires_supervision ? adults[0]?.id : undefined)
    }
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

  // ─────────────────────────────────────────────────────────────────────────
  // sub-componente: card de tarefa (reutilizado em ambas as views)
  // ─────────────────────────────────────────────────────────────────────────
  function TaskCard({ t, compact = false }: { t: Task; compact?: boolean }) {
    const checklist = Array.isArray(t.checklist) ? t.checklist : []
    const doneCk    = checklist.filter(i => i.done).length
    const overdue   = (t as any).due_date && new Date((t as any).due_date) < today && t.status !== 'done'
    const time      = (t as any).due_time ? (t as any).due_time.slice(0, 5) : null

    const priorityDot: Record<string, string> = { '1': 'bg-green-400', '2': 'bg-yellow-400', '3': 'bg-red-500' }
    const dot = priorityDot[String((t as any).priority)] ?? 'bg-gray-300'

    if (compact) {
      // versão compacta para agenda
      return (
        <div
          onClick={() => openEdit(t)}
          className={`rounded-lg px-2 py-1.5 cursor-pointer border text-xs leading-tight
            ${t.status === 'done'
              ? 'bg-gray-50 border-gray-200 opacity-60'
              : overdue
              ? 'bg-red-50 border-red-200'
              : 'bg-white border-gray-200 hover:border-teal-400 hover:shadow-sm'}
            transition-all`}
        >
          <div className="flex items-center gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); handleComplete(t) }}
              className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center
                ${t.status === 'done' ? 'bg-teal-500 border-teal-500' : 'border-gray-300 hover:border-teal-400'}`}
            >
              {t.status === 'done' && (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span className={`font-medium truncate ${t.status === 'done' ? 'line-through text-gray-400' : ''}`}>
              {t.title}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
          </div>
          {(time || memberName(t.assigned_to)) && (
            <p className="text-gray-400 mt-0.5 truncate pl-5">
              {time && <span className="font-medium text-gray-500">{time} </span>}
              {memberName(t.assigned_to)}
            </p>
          )}
        </div>
      )
    }

    // versão lista
    return (
      <li className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
        <input
          type="checkbox"
          checked={t.status === 'done'}
          onChange={() => handleComplete(t)}
          className="w-4 h-4 accent-teal-600 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${t.status === 'done' ? 'line-through text-gray-400' : ''}`}>
            {t.title}
          </p>
          <p className="text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            {memberName(t.assigned_to) && <span>{memberName(t.assigned_to)}</span>}
            {(t as any).due_date && (
              <span>📅 {formatTaskDateTime((t as any).due_date, (t as any).due_time)}</span>
            )}
            {overdue && <span className="text-red-500 font-medium">Atrasada</span>}
            {t.requires_supervision && <span>👤 Requer adulto</span>}
            {checklist.length > 0 && (
              <span className={doneCk === checklist.length ? 'text-green-500' : ''}>
                ✅ {doneCk}/{checklist.length}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => openEdit(t)}>Editar</button>
          <button className="text-xs text-red-400 hover:text-red-600" onClick={() => remove(t.id)}>×</button>
        </div>
      </li>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: AGENDA
  // ─────────────────────────────────────────────────────────────────────────
  function AgendaView() {
    return (
      <div className="rounded-xl border bg-white overflow-hidden">
        {/* navegação de semana */}
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">{weekLabel}</p>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-teal-600 hover:underline"
              >
                Hoje
              </button>
            )}
          </div>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Próxima semana"
          >
            ›
          </button>
        </div>

        {/* grid de dias — scroll horizontal em mobile */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[560px]">
            {/* cabeçalho */}
            {weekDays.map((d, i) => {
              const isToday = toISODate(d) === toISODate(today)
              const isPast  = d < today
              return (
                <div
                  key={i}
                  className={`px-2 py-2 border-b border-r last:border-r-0 text-center
                    ${isToday ? 'bg-teal-50' : 'bg-gray-50'}`}
                >
                  <p className={`text-xs font-medium uppercase tracking-wide
                    ${isToday ? 'text-teal-700' : isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                    {WEEKDAY_SHORT[i]}
                  </p>
                  <p className={`text-lg font-bold leading-tight
                    ${isToday
                      ? 'text-teal-600'
                      : isPast ? 'text-gray-300' : 'text-gray-700'}`}>
                    {d.getDate()}
                  </p>
                  {/* bolinha indicadora */}
                  {tasksByDay[toISODate(d)]?.some(t => t.status !== 'done') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mx-auto mt-0.5" />
                  )}
                </div>
              )
            })}

            {/* células de tarefas */}
            {weekDays.map((d, i) => {
              const key  = toISODate(d)
              const day  = tasksByDay[key] ?? []
              const isToday = key === toISODate(today)
              return (
                <div
                  key={i}
                  className={`border-r last:border-r-0 p-1.5 min-h-[120px] align-top
                    ${isToday ? 'bg-teal-50/40' : ''}`}
                >
                  <div className="space-y-1">
                    {day.map(t => <TaskCard key={t.id} t={t} compact />)}
                    {day.length === 0 && (
                      <p className="text-xs text-gray-300 text-center pt-4">—</p>
                    )}
                  </div>
                  {/* botão rápido de nova tarefa no dia */}
                  <button
                    onClick={() => {
                      setSelectedTask({ due_date: key } as any)
                      setTaskOpen(true)
                    }}
                    className="mt-1 w-full text-xs text-gray-300 hover:text-teal-500 hover:bg-teal-50 rounded py-0.5 transition-colors"
                    title={`Nova tarefa em ${WEEKDAY_LONG[i]}`}
                  >
                    +
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* tarefas sem data */}
        {noDateTasks.length > 0 && (
          <div className="border-t px-4 py-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Sem data</p>
            <div className="flex flex-wrap gap-1.5">
              {noDateTasks.map(t => (
                <div key={t.id} className="max-w-[200px]">
                  <TaskCard t={t} compact />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW: LISTA
  // ─────────────────────────────────────────────────────────────────────────
  function ListView() {
    const unassigned = tasks.filter(t => !t.assigned_to)
    return (
      <>
        {unassigned.length > 0 && (
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-500">📋 Sem responsável</h3>
            </div>
            <ul className="divide-y">
              {unassigned.map(t => <TaskCard key={t.id} t={t} />)}
            </ul>
          </div>
        )}

        {members.map(m => {
          const mt = tasks.filter(t => t.assigned_to === m.id)
          if (mt.length === 0) return null
          return (
            <div key={m.id} className="rounded-xl border bg-white overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h3 className="font-semibold">{(m as any).nickname ?? (m as any).name}</h3>
              </div>
              <ul className="divide-y">
                {mt.map(t => <TaskCard key={t.id} t={t} />)}
              </ul>
            </div>
          )
        })}

        {tasks.length === 0 && !isLoading && (
          <EmptyState title="Nenhuma tarefa" description="Adicione tarefas para a semana." />
        )}
      </>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        emoji="📅"
        title="Semana"
        description="Tarefas e check-in emocional"
        action={
          <div className="flex items-center gap-2">
            {/* toggle Lista / Agenda */}
            <div className="flex rounded-lg border overflow-hidden text-sm">
              <button
                onClick={() => setView('lista')}
                className={`px-3 py-1.5 transition-colors ${view === 'lista' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                ☰ Lista
              </button>
              <button
                onClick={() => setView('agenda')}
                className={`px-3 py-1.5 border-l transition-colors ${view === 'agenda' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                🗓 Agenda
              </button>
            </div>
            <button
              className="text-sm text-teal-600 font-medium hover:underline"
              onClick={openNew}
            >
              + Tarefa
            </button>
          </div>
        }
      />

      {/* Check-in emocional */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">💚 Check-in emocional — semana atual</h2>
          <button
            className="text-sm text-teal-600 font-medium hover:underline"
            onClick={() => setCheckinOpen(true)}
          >
            + Registrar
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {members.map(m => {
            const avg = weekMoodAverage(m.id)
            return (
              <div key={m.id} className="rounded-lg border p-3 text-center">
                <p className="text-2xl">{moodEmoji(avg)}</p>
                <p className="text-sm font-medium mt-1">{(m as any).nickname ?? (m as any).name}</p>
                <p className="text-xs text-gray-400">
                  {avg !== null ? `${avg.toFixed(1)}/5` : 'Sem registro'}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* view principal */}
      {view === 'agenda' ? <AgendaView /> : <ListView />}

      <TaskSheet
        open={taskOpen}
        onClose={() => { setTaskOpen(false); setSelectedTask(null) }}
        task={selectedTask}
        onSave={upsert}
        members={members}
      />
      <CheckinSheet
        open={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        onSave={addCheckin}
        members={members}
      />
    </div>
  )
}
