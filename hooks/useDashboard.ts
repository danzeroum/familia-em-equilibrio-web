'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { DailyFocusItem, Radar90Item } from '@/types/database'

export function useDashboard() {
  const { family } = useFamilyStore()
  const [focusItems, setFocusItems]   = useState<DailyFocusItem[]>([])
  const [radarItems, setRadarItems]   = useState<Radar90Item[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const [error, setError]             = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    if (!family?.id) return

    setIsLoading(true)
    setError(null)

    const [focusRes, radarRes] = await Promise.all([
      supabase.rpc('get_daily_focus', { p_family_id: family.id }),
      supabase.rpc('get_radar_90',    { p_family_id: family.id }),
    ])

    if (focusRes.error) {
      console.error('[useDashboard] get_daily_focus:', focusRes.error.message)
      setError(focusRes.error.message)
    }
    if (radarRes.error) {
      console.error('[useDashboard] get_radar_90:', radarRes.error.message)
      setError(radarRes.error.message)
    }

    setFocusItems((focusRes.data as DailyFocusItem[]) ?? [])
    setRadarItems((radarRes.data as Radar90Item[])    ?? [])
    setIsLoading(false)
  }, [family?.id])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  // ─── Derived counts ─────────────────────────────────────────
  const overdueCount  = focusItems.filter(i => i.urgency === 'overdue').length
  const todayCount    = focusItems.filter(i => i.urgency === 'today').length
  const criticalRadar = radarItems.filter(i => i.urgency_score === 1).length

  return {
    focusItems,
    radarItems,
    isLoading,
    error,
    reload: loadDashboard,
    // métricas rápidas para badges no header
    overdueCount,
    todayCount,
    criticalRadar,
  }
}
