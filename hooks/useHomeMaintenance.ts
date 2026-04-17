'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { HomeMaintenance } from '@/types/database'

const DEFAULT_ITEMS = [
  { title: 'Ar-condicionado', emoji: '❄️', frequency_label: 'A cada 6 meses', frequency_days: 180 },
  { title: 'Filtro de água', emoji: '💧', frequency_label: 'A cada 3 meses', frequency_days: 90 },
  { title: 'Extintor', emoji: '🧯', frequency_label: 'Anual', frequency_days: 365 },
  { title: 'Botijão de gás', emoji: '🔥', frequency_label: 'Mensal', frequency_days: 30 },
  { title: 'Dedetização', emoji: '🐛', frequency_label: 'A cada 6 meses', frequency_days: 180 },
  { title: 'Caixa d\'água', emoji: '🚿', frequency_label: 'Anual', frequency_days: 365 },
  { title: 'Revisão elétrica', emoji: '🔌', frequency_label: 'Anual', frequency_days: 365 },
  { title: 'Limpeza de calhas', emoji: '🪟', frequency_label: 'A cada 6 meses', frequency_days: 180 },
  { title: 'Revisão de fechaduras', emoji: '🔒', frequency_label: 'Anual', frequency_days: 365 },
]

export interface MaintenanceWithAlert extends HomeMaintenance {
  daysRemaining: number | null
  alertLevel: 'ok' | 'due_soon' | 'overdue'
}

export function useHomeMaintenance() {
  const { family } = useFamilyStore()
  const [items, setItems] = useState<MaintenanceWithAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { if (family?.id) load() }, [family?.id])

  async function load() {
    if (!family?.id) return
    setIsLoading(true)

    const { data } = await supabase
      .from('home_maintenance')
      .select('*')
      .eq('family_id', family.id)
      .order('created_at')

    let rows = data ?? []

    // Seed itens padrão se tabela vazia para esta família
    if (rows.length === 0) {
      const seeds = DEFAULT_ITEMS.map(d => ({ ...d, family_id: family.id }))
      const { data: inserted } = await supabase
        .from('home_maintenance')
        .insert(seeds)
        .select()
      rows = inserted ?? []
    }

    const today = new Date()
    setItems(
      rows.map(r => {
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
      })
    )
    setIsLoading(false)
  }

  async function upsert(item: Partial<HomeMaintenance> & { title: string; frequency_days: number; frequency_label: string }) {
    if (!family?.id) return
    if (item.id) {
      await supabase.from('home_maintenance').update(item).eq('id', item.id)
    } else {
      await supabase.from('home_maintenance').insert({ ...item, family_id: family.id } as any)
    }
    await load()
  }

  async function markDone(id: string) {
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('home_maintenance').update({ last_done_at: today, status: 'done' }).eq('id', id)
    await load()
  }

  async function remove(id: string) {
    await supabase.from('home_maintenance').delete().eq('id', id)
    await load()
  }

  return { items, isLoading, upsert, markDone, remove, reload: load }
}
