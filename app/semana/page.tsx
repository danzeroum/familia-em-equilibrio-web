'use client'

import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useTasks } from '@/hooks/useTasks'
import { useEmotionalCheckins } from '@/hooks/useEmotionalCheckins'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskSheet } from '@/components/sheets/TaskSheet'
import { CheckinSheet } from '@/components/sheets/CheckinSheet'
import { formatDate } from '@/lib/utils'
import type { Task } from '@/types/database'

export default function SemanaPage() {
  const { currentFamily, members } = useFamilyStore()
  const { tasks, isLoading, upsert, complete, remove } = useTasks()
  const { weekCheckins, addCheckin, weekMoodAverage } = useEmotionalCheckins(currentFamily?.id ?? null)

  const [taskOpen, setTaskOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [checkinOpen, setCheckinOpen] = useState(false)

  const adults = members.filter(m => m.member_type === 'adult')

  const moodEmoji = (avg: number | null) => {
    if (avg === null) return '—'
    if (avg >= 4.5) return '😄'
    if (avg >= 3.5) return '🙂'
    if (avg >= 2.5) return '😐'
    if (avg >= 1.5) return '😔'
    return '😢'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="📅 Semana"
        subtitle="Tarefas e check-in emocional"
        action={{ label: '+ Tarefa', onClick: () => { setSelectedTask(null); setTaskOpen(true) } }}
      />

      {/* Check-in emocional por membro */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-semibold">💚 Check-in emocional — semana atual</h2>
          <button className="text-sm text-teal-600 font-medium hover:underline" onClick={() => setCheckinOpen(true)}>
            + Registrar
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
          {members.map(m => {
            const avg = weekMoodAverage(m.id)
            return (
              <div key={m.id} className="rounded-lg border p-3 text-center">
                <p className="text-2xl">{moodEmoji(avg)}</p>
                <p className="text-sm font-medium mt-1">{m.nickname ?? m.name}</p>
                <p className="text-xs text-gray-400">{avg !== null ? `${avg.toFixed(1)}/5` : 'Sem registro'}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tarefas por membro */}
      {members.map(m => {
        const memberTasks = tasks.filter(t => t.assigned_to === m.id)
        if (memberTasks.length === 0) return null
        return (
          <div key={m.id} className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h3 className="font-semibold">{m.nickname ?? m.name}</h3>
            </div>
            <ul className="divide-y">
              {memberTasks.map(t => (
                <li key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={t.status === 'done'}
                    onChange={() => {
                      if (t.status !== 'done') {
                        const validator = adults[0]?.id
                        complete(t.id, t.requires_adult_validation ? validator : undefined)
                      }
                    }}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-gray-400' : ''}`}>{t.title}</p>
                    <p className="text-xs text-gray-400">
                      {t.due_date && formatDate(t.due_date)}
                      {t.requires_adult_validation && ' · 👤 Requer adulto'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => { setSelectedTask(t); setTaskOpen(true) }}>Editar</button>
                    <button className="text-xs text-red-400 hover:text-red-600" onClick={() => remove(t.id)}>×</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      {tasks.length === 0 && !isLoading && (
        <EmptyState title="Nenhuma tarefa" description="Adicione tarefas para a semana." />
      )}

      <TaskSheet open={taskOpen} onClose={() => setTaskOpen(false)} task={selectedTask} onSave={upsert} members={members} />
      <CheckinSheet open={checkinOpen} onClose={() => setCheckinOpen(false)} onSave={addCheckin} members={members} />
    </div>
  )
}
