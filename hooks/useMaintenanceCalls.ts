'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'

export interface MaintenanceCall {
  id: string
  family_id?: string
  title: string
  description?: string | null
  status?: string | null          // 'pending' | 'scheduled' | 'done'
  priority?: number | null        // 1=crítico 2=importante 3=quando puder
  professional_name?: string | null
  professional_phone?: string | null
  estimated_cost?: number | null
  scheduled_date?: string | null  // nullable — registra antes de saber a data
  domain_id?: number | null
  created_by?: string | null
  completed_at?: string | null
  created_at?: string | null
}

function toMaintenanceCalls(rows: any[]): MaintenanceCall[] {
  return rows.map(r => ({
    ...r,
    family_id: r.family_id ?? undefined,
  }))
}

export function useMaintenanceCalls() {
  const { family, currentUser } = useFamilyStore()
  const [items, setItems] = useState<MaintenanceCall[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { if (family?.id) load() }, [family?.id])

  async function load() {
    if (!family?.id) return
    setIsLoading(true)
    const { data } = await supabase
      .from('maintenance_calls')
      .select('*')
      .eq('family_id', family.id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })
    setItems(toMaintenanceCalls(data ?? []))
    setIsLoading(false)
  }

  async function upsert(item: Partial<MaintenanceCall> & { title: string }) {
    if (!family?.id) return
    const payload = {
      ...item,
      family_id: family.id,
      created_by: item.created_by ?? currentUser?.id,
      status: item.status ?? 'pending',
      priority: item.priority ?? 2,
    }
    if (item.id) {
      const { id: _id, created_at: _cat, family_id: _fid, ...rest } = payload as any
      await supabase.from('maintenance_calls').update(rest).eq('id', item.id)
    } else {
      await supabase.from('maintenance_calls').insert(payload as any)
    }
    await load()
  }

  async function markDone(id: string) {
    await supabase
      .from('maintenance_calls')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', id)
    await load()
  }

  async function remove(id: string) {
    await supabase.from('maintenance_calls').delete().eq('id', id)
    await load()
  }

  const pending   = items.filter(i => i.status === 'pending')
  const scheduled = items.filter(i => i.status === 'scheduled')
  const done      = items.filter(i => i.status === 'done')
  const alerts    = items.filter(i => i.status !== 'done' && (i.priority ?? 2) === 1).length

  return { items, pending, scheduled, done, alerts, isLoading, upsert, markDone, remove, reload: load }
}
