'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useRadarItems } from '@/hooks/useRadarItems'
import { useBills } from '@/hooks/useBills'
import { useTasks } from '@/hooks/useTasks'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { formatTaskDateTime } from '@/lib/formatDateTime'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
}

function getWeekStart(ref: Date) {
  const d = new Date(ref)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function addDays(d: Date, n: number) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export default function PainelPage() {
  const { currentFamily, members } = useFamilyStore()
  const { items, counts, isLoading } = useRadarItems(currentFamily?.id ?? null)
  const { bills, totalMonthly } = useBills()
  const { tasks } = useTasks()

  const [taskView, setTaskView] = useState<'lista' | 'agenda'>('agenda')
  const [weekOffset, setWeekOffset] = useState(0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const in7 = new Date(today)
  in7.setDate(today.getDate() + 7)

  const weekTasks = tasks.filter(t => {
    if (t.status === 'done') return false
    if (!t.due_date) return true
    const d = new Date(t.due_date)
    return d <= in7
  }).sort((a, b) => {
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    const dc = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    if (dc !== 0) return dc
    const ta = (a as any).due_time ?? ''
    const tb = (b as any).due_time ?? ''
    return ta.localeCompare(tb)
  })

  // Agenda: tarefas de TODAS as datas (não só próximos 7 dias)
  const allPendingTasks = tasks.filter(t => t.status !== 'done')

  const focusDo = items.filter(i => i.priority === 'urgent' || i.priority === 'overdue').slice(0, 3)

  const memberName = (id: string | null) => {
    if (!id) return null
    const m = members.find(m => m.id === id)
    return m?.nickname ?? m?.name ?? null
  }

  // --- Agenda helpers ---
  const weekStart = addDays(getWeekStart(today), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const tasksForDay = (day: Date) =>
    allPendingTasks.filter(t => {
      if (!t.due_date) return false
      const d = new Date(t.due_date)
      d.setHours(0, 0, 0, 0)
      return sameDay(d, day)
    }).sort((a, b) => {
      const ta = (a as any).due_time ?? ''
      const tb = (b as any).due_time ?? ''
      return ta.localeCompare(tb)
    })

  const tasksNoDate = allPendingTasks.filter(t => !t.due_date)

  const weekLabel = () => {
    const end = addDays(weekStart, 6)
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    return `${fmt(weekStart)} – ${fmt(end)}`
  }

  return (
    <div className="space-y-6">
      <PageHeader title="🎯 Painel" subtitle="Visão geral da família" />

      {/* Semáforo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SemaforoCard label="🔴 Urgente" value={counts.urgent} color="text-red-600 bg-red-50" />
        <SemaforoCard label="🟡 Atenção" value={counts.attention} color="text-yellow-600 bg-yellow-50" />
        <SemaforoCard label="🟢 Planejado" value={counts.planned} color="text-green-600 bg-green-50" />
        <SemaforoCard label="✅ Feito" value={counts.done} color="text-gray-600 bg-gray-50" />
      </div>

      {/* Foco do dia */}
      {focusDo.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="font-semibold text-red-700 mb-3">🚨 Foco do dia</h2>
          <ul className="space-y-2">
            {focusDo.map(i => (
              <li key={i.id} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-red-800">{i.category}</span>
                <span className="text-gray-700">{i.title}</span>
                <span className="ml-auto text-red-600 font-bold">
                  {i.daysLeft !== null && i.daysLeft < 0 ? `${Math.abs(i.daysLeft)}d atraso` : `${i.daysLeft}d`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tarefas da semana */}
      <div className="rounded-xl border bg-white overflow-hidden">
        {/* Header com toggle */}
        <div className="px-4 py-3 border-b flex items-center justify-between gap-2 flex-wrap">
          <h2 className="font-semibold">📅 Tarefas da semana</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{weekTasks.length} pendentes</span>
            <div className="flex rounded-lg border overflow-hidden text-xs font-medium">
              <button
                onClick={() => setTaskView('lista')}
                className={`px-3 py-1.5 transition-colors ${taskView === 'lista' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                ☰ Lista
              </button>
              <button
                onClick={() => setTaskView('agenda')}
                className={`px-3 py-1.5 transition-colors ${taskView === 'agenda' ? 'bg-teal-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                🗓 Agenda
              </button>
            </div>
          </div>
        </div>

        {/* VIEW LISTA */}
        {taskView === 'lista' && (
          weekTasks.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Nenhuma tarefa pendente para os próximos 7 dias.</div>
          ) : (
            <ul className="divide-y">
              {weekTasks.map(t => {
                const isOverdue = t.due_date && new Date(t.due_date) < today
                const dateTime = formatTaskDateTime((t as any).due_date, (t as any).due_time)
                return (
                  <li key={t.id} className="px-4 py-3 flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-teal-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-gray-400">
                        {memberName(t.assigned_to) ?? 'Sem responsável'}
                        {dateTime && ` · ${dateTime}`}
                      </p>
                    </div>
                    {isOverdue && (
                      <span className="text-xs font-semibold text-red-500 flex-shrink-0">Atrasada</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )
        )}

        {/* VIEW AGENDA */}
        {taskView === 'agenda' && (
          <div>
            {/* Navegação de semana */}
            <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                aria-label="Semana anterior"
              >
                ‹
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600">{weekLabel()}</span>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Hoje
                  </button>
                )}
              </div>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                aria-label="Próxima semana"
              >
                ›
              </button>
            </div>

            {/* Grid 7 colunas */}
            <div className="grid grid-cols-7 divide-x min-h-[160px]">
              {weekDays.map((day, idx) => {
                const isToday = sameDay(day, today)
                const isPast = day < today && !isToday
                const dayTasks = tasksForDay(day)
                const hasTasks = dayTasks.length > 0

                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isToday ? 'bg-teal-50' : isPast ? 'bg-gray-50/60' : 'bg-white'}`}
                  >
                    {/* Cabeçalho do dia */}
                    <div className="flex flex-col items-center pt-2 pb-1 border-b">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${isToday ? 'text-teal-600' : 'text-gray-400'}`}>
                        {WEEKDAYS[idx]}
                      </span>
                      <span className={`text-sm font-bold leading-none mt-0.5 ${isToday ? 'text-teal-600' : isPast ? 'text-gray-300' : 'text-gray-700'}`}>
                        {day.getDate()}
                      </span>
                      {/* Indicador de tarefas */}
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${hasTasks ? (isToday ? 'bg-teal-500' : 'bg-gray-400') : 'bg-transparent'}`} />
                    </div>

                    {/* Cards de tarefas */}
                    <div className="flex-1 p-1 space-y-1 overflow-hidden">
                      {dayTasks.length === 0 ? (
                        <div className="h-full" />
                      ) : (
                        dayTasks.map(t => {
                          const isOverdue = t.due_date && new Date(t.due_date) < today
                          const priority = (t as any).priority ?? 'low'
                          const time = (t as any).due_time
                          const name = memberName(t.assigned_to)
                          return (
                            <div
                              key={t.id}
                              className={`rounded p-1 text-[10px] leading-tight cursor-pointer hover:opacity-80 transition-opacity ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-white border border-gray-100 text-gray-700 shadow-sm'}`}
                              title={t.title}
                            >
                              <div className="flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[priority] ?? 'bg-gray-300'}`} />
                                <span className="font-medium truncate">{t.title}</span>
                              </div>
                              {(time || name) && (
                                <div className="text-gray-400 mt-0.5 truncate">
                                  {time && <span>{time.slice(0, 5)}</span>}
                                  {time && name && <span> · </span>}
                                  {name && <span>{name}</span>}
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tarefas sem data */}
            {tasksNoDate.length > 0 && (
              <div className="px-4 py-2 border-t bg-gray-50 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-gray-400 font-medium mr-1">Sem data:</span>
                {tasksNoDate.map(t => (
                  <span key={t.id} className="text-xs bg-white border border-gray-200 text-gray-600 rounded-full px-2 py-0.5 truncate max-w-[140px]" title={t.title}>
                    {t.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Radar */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">📡 Radar — próximos 90 dias</h2>
          <span className="text-sm text-gray-500">{items.length} itens</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : items.length === 0 ? (
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
                {items.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap">{i.category}</td>
                    <td className="px-4 py-2 font-medium">{i.title}</td>
                    <td className="px-4 py-2 text-gray-500">{i.action}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{i.eventDate ? formatDate(i.eventDate) : '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`font-bold ${
                        i.daysLeft !== null && i.daysLeft < 0 ? 'text-red-600' :
                        i.daysLeft !== null && i.daysLeft <= 7 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {i.daysLeft !== null ? (i.daysLeft < 0 ? `${Math.abs(i.daysLeft)}d atrás` : `${i.daysLeft}d`) : '—'}
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
        <p className="text-sm text-gray-500">{bills.filter(b => b.status === 'pending').length} contas pendentes</p>
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
