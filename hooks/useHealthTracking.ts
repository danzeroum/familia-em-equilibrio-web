'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'

export interface HealthTrackingItem {
  id: string
  family_id: string
  profile_id: string | null
  title: string
  emoji: string
  category: string
  frequency_label: string
  frequency_days: number
  responsible_id: string | null
  last_done_at: string | null
  next_due_at: string | null
  notes: string | null
  status: string
  created_at: string
  // computed
  daysRemaining: number | null
  alertLevel: 'ok' | 'due_soon' | 'overdue'
}

const DEFAULT_ITEMS = [
  { title: 'Consulta pediátrica',    emoji: '👶', category: 'consulta',  frequency_label: 'Anual',          frequency_days: 365, profile_id: null },
  { title: 'Dentista',               emoji: '🦷', category: 'consulta',  frequency_label: 'A cada 6 meses', frequency_days: 180, profile_id: null },
  { title: 'Vacina da gripe',        emoji: '💉', category: 'vacina',    frequency_label: 'Anual',          frequency_days: 365, profile_id: null },
  { title: 'Verificar caixa de remédios', emoji: '📊', category: 'rotina', frequency_label: 'Mensal',       frequency_days: 30,  profile_id: null },
  { title: 'Checar prontuário',      emoji: '📋', category: 'rotina',    frequency_label: 'Após consulta',  frequency_days: 90,  profile_id: null },
]

export function useHealthTracking() {
  const { family } = useFamilyStore()
  const [items, setItems] = useState<HealthTrackingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { if (family?.id) load() }, [family?.id])

  async function load() {
    if (!family?.id) return
    setIsLoading(true)

    const { data } = await supabase
      .from('health_tracking')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at')

    let rows = data ?? []

    if (rows.length === 0) {
      const seeds = DEFAULT_ITEMS.map(d => ({ ...d, family_id: family.id }))
      const { data: inserted } = await supabase
        .from('health_tracking')
        .insert(seeds)
        .select()
      rows = inserted ?? []
    }

    const today = new Date()
    setItems(rows.map(r => {
      let daysRemaining: number | null = null
      let alertLevel: 'ok' | 'due_soon' | 'overdue' = 'ok'
      if (r.next_due_at) {
        const due = new Date(r.next_due_at)
        daysRemaining = Math.ceil((due.getTime() - today.getTime()) / 86400000)
        if (daysRemaining < 0) alertLevel = 'overdue'
        else if (daysRemaining <= 30) alertLevel = 'due_soon'
      } else {
        alertLevel = 'due_soon'
      }
      return { ...r, daysRemaining, alertLevel }
    }))
    setIsLoading(false)
  }

  async function upsert(item: Partial<HealthTrackingItem> & { title: string; frequency_days: number; frequency_label: string }) {
    if (!family?.id) return
    if (item.id) {
      const { id, daysRemaining, alertLevel, ...rest } = item as any
      await supabase.from('health_tracking').update(rest).eq('id', id)
    } else {
      const { daysRemaining, alertLevel, ...rest } = item as any
      await supabase.from('health_tracking').insert({ ...rest, family_id: family.id })
    }
    await load()
  }

  async function markDone(id: string) {
    const item = items.find(i => i.id === id)
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    let nextDueAt: string | null = null
    if (item?.frequency_days) {
      const next = new Date(today)
      next.setDate(next.getDate() + item.frequency_days)
      nextDueAt = next.toISOString().slice(0, 10)
    }
    await supabase.from('health_tracking').update({
      last_done_at: todayStr,
      next_due_at: nextDueAt,
      status: 'done',
    }).eq('id', id)
    await load()
  }

  async function remove(id: string) {
    await supabase.from('health_tracking').delete().eq('id', id)
    await load()
  }

  return { items, isLoading, upsert, markDone, remove, reload: load }
}
