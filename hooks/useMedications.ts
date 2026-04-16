'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { daysUntil, getMedicationStatus } from '@/lib/utils'
import type { Medication, MedicationLog } from '@/types/database'

export interface MedicationWithStatus extends Medication {
  statusLabel: string
  statusColor: string
  daysUntilExpiry: number | null
}

export function useMedications(profileId?: string) {
  const [medications, setMedications] = useState<MedicationWithStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [profileId])

  async function load() {
    setIsLoading(true)
    let query = supabase.from('medications').select('*').eq('is_active', true)
    if (profileId) query = query.eq('profile_id', profileId)

    const { data } = await query
    const enriched = (data ?? []).map((m) => {
      const s = getMedicationStatus(m.expiry_date, m.stock_quantity, m.minimum_stock)
      return {
        ...m,
        statusLabel: s.label,
        statusColor: s.color,
        daysUntilExpiry: daysUntil(m.expiry_date),
      }
    })
    setMedications(enriched)
    setIsLoading(false)
  }

  async function upsert(med: Partial<Medication> & { name: string }) {
    if (med.id) {
      await supabase.from('medications').update(med).eq('id', med.id)
    } else {
      await supabase.from('medications').insert(med as any)
    }
    await load()
  }

  async function logDose(log: { medication_id: string; profile_id: string; dose_given: string; given_by: string; notes?: string }) {
    await supabase.from('medication_logs').insert({
      ...log,
      given_at: new Date().toISOString(),
    })
  }

  async function remove(id: string) {
    await supabase.from('medications').update({ is_active: false }).eq('id', id)
    await load()
  }

  return { medications, isLoading, upsert, logDose, remove, reload: load }
}
