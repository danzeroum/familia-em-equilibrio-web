'use client'
import type { Profile } from '@/types/database'
import { TaskFields } from './TaskFields'
import { SubtaskFields } from './SubtaskFields'
import { HealthTrackingFields } from './HealthTrackingFields'
import { HomeworkFields } from './HomeworkFields'
import { SchoolItemFields } from './SchoolItemFields'
import { EmergencyContactFields } from './EmergencyContactFields'
import { GratitudeFields } from './GratitudeFields'
import { MaintenanceCallFields } from './MaintenanceCallFields'

// Tipo local para cobrir todos os casos do switch — independente do QuickRegisterType
export type DynamicFieldType =
  | 'task'
  | 'subtask'
  | 'health_tracking'
  | 'homework'
  | 'school_item'
  | 'emergency_contact'
  | 'gratitude'
  | 'maintenance_call'
  | 'gratidao'
  | 'conquista'
  | 'desafio'
  | 'memoria'
  | 'aprendizado'
  | string

interface Props {
  type: DynamicFieldType
  data: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  members: Profile[]
}

export function DynamicFields({ type, data, onChange, members }: Props) {
  const props = { data, onChange, members }

  switch (type) {
    case 'task':
      return <TaskFields {...props} />
    case 'subtask':
      return <SubtaskFields {...props} />
    case 'health_tracking':
      return <HealthTrackingFields {...props} />
    case 'homework':
      return <HomeworkFields {...props} />
    case 'school_item':
      return <SchoolItemFields {...props} />
    case 'emergency_contact':
      return <EmergencyContactFields data={data} onChange={onChange} />
    case 'gratitude':
    case 'gratidao':
    case 'conquista':
    case 'desafio':
    case 'memoria':
    case 'aprendizado':
      return <GratitudeFields {...props} />
    case 'maintenance_call':
      return <MaintenanceCallFields data={data} onChange={onChange} />
    default:
      return (
        <>
          <input
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            placeholder="T\u00edtulo *"
            value={(data.title as string) ?? ''}
            onChange={(e) => onChange('title', e.target.value)}
            autoFocus
          />
          <select
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            value={(data.assigned_to as string) ?? ''}
            onChange={(e) => onChange('assigned_to', e.target.value || undefined)}
          >
            <option value="">\u2014 Ningu\u00e9m \u2014</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname ?? m.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            value={(data.due_date as string) ?? ''}
            onChange={(e) => onChange('due_date', e.target.value || undefined)}
          />
        </>
      )
  }
}
