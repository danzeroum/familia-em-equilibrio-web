'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { daysUntil, getPriority } from '@/lib/utils'
import type { Vaccine } from '@/types/database'

export interface VaccineWithMeta extends Vaccine {
  daysLeft: number | null
  priority: 'urgent' | 'attention' | 'planned' | 'overdue'
}

export function useVaccines(profileId?: string) {
  const [vaccines, setVaccines] = useState<VaccineWithMeta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [profileId])

  async function load() {
    setIsLoading(true)
    let query = supabase.from('vaccines').select('*').order('next_due', { ascending: true })
    if (profileId) query = query.eq('profile_id', profileId)

    const { data } = await query
    setVaccines(
      (data ?? []).map((v) => ({
        ...v,
        daysLeft: daysUntil(v.next_due),
        priority: getPriority(daysUntil(v.next_due)),
      }))
    )
    setIsLoading(false)
  }

  async function upsert(vaccine: Partial<Vaccine> & { name: string }) {
    if (vaccine.id) {
      const { id: _id, created_at: _cat, ...updateData } = vaccine
      await supabase.from('vaccines').update(updateData).eq('id', vaccine.id)
    } else {
      await supabase.from('vaccines').insert(vaccine as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('vaccines').delete().eq('id', id)
    await load()
  }

  return { vaccines, isLoading, upsert, remove, reload: load }
}
