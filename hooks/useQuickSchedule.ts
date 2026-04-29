'use client'
import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { useTasks } from '@/hooks/useTasks'
import { useFamilyEvents } from '@/hooks/useFamilyEvents'

export function useQuickSchedule() {
  const { currentFamily, members } = useFamilyStore()
  const { upsert: upsertTask } = useTasks()
  const { upsert: upsertEvent } = useFamilyEvents(currentFamily?.id ?? null)

  const [schedOpen, setSchedOpen] = useState(false)
  const [schedPrefill, setSchedPrefill] = useState<{
    title?: string; date?: string; time?: string | null
  } | undefined>()

  function schedule(title: string, date?: string | null, time?: string | null) {
    setSchedPrefill({ title, date: date ?? undefined, time: time ?? null })
    setSchedOpen(true)
  }

  return {
    schedule,
    schedOpen,
    setSchedOpen,
    schedPrefill,
    upsertTask,
    upsertEvent,
    schedFamilyId: currentFamily?.id ?? '',
    schedMembers: members,
  }
}
