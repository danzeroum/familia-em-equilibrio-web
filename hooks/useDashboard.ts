'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { DailyFocusItem, Radar90Item } from '@/types/database'

function billDueDate(due_day: number | null): string | null {
  if (!due_day) return null
  const today = new Date()
  const d = new Date(today.getFullYear(), today.getMonth(), due_day)
  if (d < today) d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

async function loadFocusFallback(familyId: string): Promise<DailyFocusItem[]> {
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const today = todayDate.toISOString().slice(0, 10)
  const tomorrowDate = new Date(todayDate)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = tomorrowDate.toISOString().slice(0, 10)
  const items: DailyFocusItem[] = []

  const { data: bills } = await supabase
    .from('bills')
    .select('id, title, amount, due_date, due_day, status')
    .eq('family_id', familyId)
    .in('status', ['pending', 'overdue'])

  for (const b of (bills ?? [])) {
    const dueDate = b.due_date ?? billDueDate(b.due_day)
    if (!dueDate) continue
    const diff = Math.ceil((new Date(dueDate).getTime() - todayDate.getTime()) / 86400000)
    const urgency = diff < 0 ? 'overdue' : diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : null
    if (urgency) items.push({
      source: 'bill', item_id: b.id, title: b.title,
      urgency, amount: b.amount ?? 0, due_date: dueDate, emoji: '💳', subtitle: null,
    })
  }

  const { data: shopping } = await supabase
    .from('shopping_items')
    .select('id, name')
    .eq('family_id', familyId)
    .eq('status', 'running_out')

  for (const s of (shopping ?? [])) {
    items.push({
      source: 'shopping', item_id: s.id, title: s.name,
      urgency: 'running_out', amount: 0, due_date: null, emoji: '🛒', subtitle: null,
    })
  }

  const { data: events } = await supabase
    .from('family_events')
    .select('id, title, event_date')
    .eq('family_id', familyId)
    .gte('event_date', today)
    .lte('event_date', tomorrow)

  for (const e of (events ?? [])) {
    const diff = Math.ceil((new Date(e.event_date).getTime() - todayDate.getTime()) / 86400000)
    items.push({
      source: 'event', item_id: e.id, title: e.title,
      urgency: diff === 0 ? 'today' : 'tomorrow', amount: 0, due_date: e.event_date, emoji: '📅', subtitle: null,
    })
  }

  const order: Record<string, number> = { overdue: 0, running_out: 1, today: 2, tomorrow: 3, due_soon: 4 }
  return items.sort((a, b) => (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9))
}

async function loadRadarFallback(familyId: string): Promise<Radar90Item[]> {
  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)
  const todayMs = todayDate.getTime()
  const todayStr = todayDate.toISOString().slice(0, 10)
  const in90 = new Date(todayMs + 90 * 86400000).toISOString().slice(0, 10)
  const items: Radar90Item[] = []

  function score(d: number): number { return d <= 7 ? 1 : d <= 30 ? 2 : 3 }
  function du(dateStr: string): number { return Math.ceil((new Date(dateStr).getTime() - todayMs) / 86400000) }

  const { data: bills } = await supabase
    .from('bills')
    .select('id, title, amount, due_date, due_day, category')
    .eq('family_id', familyId)
    .in('status', ['pending', 'overdue'])

  for (const b of (bills ?? [])) {
    const d = b.due_date ?? billDueDate(b.due_day)
    if (!d || d > in90) continue
    const days = du(d)
    if (days < 0) continue
    items.push({ source: 'bill', item_id: b.id, title: b.title, due_date: d, days_until: days, urgency_score: score(days), amount: b.amount ?? 0, category: b.category ?? 'Outros', emoji: '💳' })
  }

  const { data: events } = await supabase
    .from('family_events')
    .select('id, title, event_date')
    .eq('family_id', familyId)
    .gte('event_date', todayStr)
    .lte('event_date', in90)

  for (const e of (events ?? [])) {
    const days = du(e.event_date)
    items.push({ source: 'event', item_id: e.id, title: e.title, due_date: e.event_date, days_until: days, urgency_score: score(days), amount: 0, category: 'Eventos', emoji: '📅' })
  }

  const { data: maint } = await supabase
    .from('home_maintenance')
    .select('id, title, next_due_at, category')
    .eq('family_id', familyId)
    .not('next_due_at', 'is', null)
    .lte('next_due_at', in90)

  for (const m of (maint ?? [])) {
    const dateStr = m.next_due_at!.slice(0, 10)
    const days = du(dateStr)
    if (days < 0) continue
    items.push({ source: 'maintenance', item_id: m.id, title: m.title, due_date: dateStr, days_until: days, urgency_score: score(days), amount: 0, category: m.category ?? 'Manutenção', emoji: '🔧' })
  }

  const { data: vdocs } = await supabase
    .from('vehicle_documents')
    .select('id, title, due_date, amount')
    .eq('family_id', familyId)
    .not('due_date', 'is', null)
    .lte('due_date', in90)
    .neq('status', 'paid')
    .neq('status', 'renewed')

  for (const v of (vdocs ?? [])) {
    const days = du(v.due_date!)
    if (days < 0) continue
    items.push({ source: 'bill', item_id: v.id, title: v.title, due_date: v.due_date!, days_until: days, urgency_score: score(days), amount: v.amount ?? 0, category: 'Veículos', emoji: '🚗' })
  }

  return items.sort((a, b) => a.urgency_score - b.urgency_score || a.days_until - b.days_until)
}

export function useDashboard() {
  const { family } = useFamilyStore()
  const [focusItems, setFocusItems] = useState<DailyFocusItem[]>([])
  const [radarItems, setRadarItems] = useState<Radar90Item[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    if (!family?.id) return

    setIsLoading(true)
    setError(null)

    const [focusRes, radarRes] = await Promise.all([
      supabase.rpc('get_daily_focus', { p_family_id: family.id }),
      supabase.rpc('get_radar_90',    { p_family_id: family.id }),
    ])

    if (focusRes.error) console.error('[useDashboard] get_daily_focus:', focusRes.error.message)
    if (radarRes.error) console.error('[useDashboard] get_radar_90:', radarRes.error.message)

    const focusData = (!focusRes.error && (focusRes.data?.length ?? 0) > 0)
      ? (focusRes.data as DailyFocusItem[])
      : await loadFocusFallback(family.id)

    const radarData = (!radarRes.error && (radarRes.data?.length ?? 0) > 0)
      ? (radarRes.data as Radar90Item[])
      : await loadRadarFallback(family.id)

    setFocusItems(focusData)
    setRadarItems(radarData)
    setIsLoading(false)
  }, [family?.id])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const overdueCount  = focusItems.filter(i => i.urgency === 'overdue').length
  const todayCount    = focusItems.filter(i => i.urgency === 'today').length
  const criticalRadar = radarItems.filter(i => i.urgency_score === 1).length

  return {
    focusItems,
    radarItems,
    isLoading,
    error,
    reload: loadDashboard,
    overdueCount,
    todayCount,
    criticalRadar,
  }
}
