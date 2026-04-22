'use client'
import { QuickRegisterType } from '@/types/database'
import type { Profile } from '@/types/database'
import { TaskFields } from './TaskFields'
import { SubtaskFields } from './SubtaskFields'
import { HealthTrackingFields } from './HealthTrackingFields'
import { HomeworkFields } from './HomeworkFields'
import { SchoolItemFields } from './SchoolItemFields'
import { EmergencyContactFields } from './EmergencyContactFields'
import { GratitudeFields } from './GratitudeFields'
import { MaintenanceCallFields } from './MaintenanceCallFields'

interface Props {
  type: QuickRegisterType
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
      return <GratitudeFields {...props} />
    case 'maintenance_call':
      return <MaintenanceCallFields data={data} onChange={onChange} />
    default:
      // tipos que já tinham sheet própria (medication, bill, etc.)
      return (
        <>
          <input
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            placeholder="Título *"
            value={(data.title as string) ?? ''}
            onChange={(e) => onChange('title', e.target.value)}
            autoFocus
          />
          <select
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
            value={(data.assigned_to as string) ?? ''}
            onChange={(e) => onChange('assigned_to', e.target.value || undefined)}
          >
            <option value="">— Ninguém —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.emoji} {m.nickname}
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
