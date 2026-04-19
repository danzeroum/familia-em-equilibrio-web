import type { Task, FamilyEvent } from './database'
import type { FamilyEventWithMeta } from '@/hooks/useFamilyEvents'

export type AgendamentoKind = 'task' | 'event'

export type AgendamentoTask = Task & { _kind: 'task' }
export type AgendamentoEvent = FamilyEventWithMeta & { _kind: 'event' }
export type AgendamentoItem = AgendamentoTask | AgendamentoEvent

export function asTask(t: Task): AgendamentoTask {
  return { ...t, _kind: 'task' }
}

export function asEvent(e: FamilyEventWithMeta): AgendamentoEvent {
  return { ...e, _kind: 'event' }
}

export function agDate(item: AgendamentoItem): string | null {
  return item._kind === 'task' ? ((item as any).due_date ?? null) : item.event_date
}

export function agTime(item: AgendamentoItem): string | null {
  const raw = item._kind === 'task' ? (item as any).due_time : item.event_time
  return raw ? String(raw).slice(0, 5) : null
}

export function agIsDone(item: AgendamentoItem): boolean {
  return item._kind === 'task' ? item.status === 'done' : !!item.is_done
}

export function agAssigned(item: AgendamentoItem): string | null {
  return item.assigned_to ?? null
}

export function agTitle(item: AgendamentoItem): string {
  return item.title
}
