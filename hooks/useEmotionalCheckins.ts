'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { currentWeekStart } from '@/lib/utils'
import type { EmotionalCheckin } from '@/types/database'

export function useEmotionalCheckins(familyId: string | null) {
  const [checkins, setCheckins] = useState<EmotionalCheckin[]>([])
  const [weekCheckins, setWeekCheckins] = useState<EmotionalCheckin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!familyId) { setIsLoading(false); return }
    load()
  }, [familyId])

  async function load() {
    setIsLoading(true)
    const week = currentWeekStart()
    const { data } = await supabase
      .from('emotional_checkins')
      .select('*')
      .eq('family_id', familyId!)
      .order('done_at', { ascending: false })
      .limit(50)

    setCheckins(data ?? [])
    setWeekCheckins((data ?? []).filter((c) => c.week_start === week))
    setIsLoading(false)
  }

  async function addCheckin(checkin: {
    profile_id: string
    practice: string
    mood_level: number
    notes?: string
    registered_by: string
  }) {
    await supabase.from('emotional_checkins').insert({
      ...checkin,
      family_id: familyId,
      done_at: new Date().toISOString().split('T')[0],
      week_start: currentWeekStart(),
    } as any)
    await load()
  }

  // Média de humor da semana por membro
  function weekMoodAverage(profileId: string): number | null {
    const relevant = weekCheckins.filter((c) => c.profile_id === profileId && c.mood_level !== null)
    if (relevant.length === 0) return null
    return relevant.reduce((sum, c) => sum + (c.mood_level ?? 0), 0) / relevant.length
  }

  return { checkins, weekCheckins, isLoading, addCheckin, weekMoodAverage, reload: load }
}
