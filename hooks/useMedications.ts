'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { daysUntil, getMedicationStatus } from '@/lib/utils'
import type { Medication } from '@/types/database'

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

    const { data, error } = await query
    if (error) console.error('[useMedications] load error:', error)

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
    // Garante que profile_id nunca seja string vazia (violaria a RLS)
    const payload = {
      ...med,
      profile_id: med.profile_id || null,
    }

    let error: any
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      ;({ error } = await supabase.from('medications').update(updateData).eq('id', payload.id))
    } else {
      ({ error } = await supabase.from('medications').insert(payload as any))
    }

    if (error) {
      console.error('[useMedications] upsert error:', error)
      alert(`Erro ao salvar: ${error.message}`)
      return
    }
    await load()
  }

  async function logDose(log: { medication_id: string; profile_id: string; dose_given: string; given_by: string; notes?: string }) {
    await supabase.from('medication_logs').insert({
      ...log,
      notes: log.notes ?? null,
      given_at: new Date().toISOString(),
    })
  }

  async function remove(id: string) {
    const { error } = await supabase.from('medications').update({ is_active: false }).eq('id', id)
    if (error) console.error('[useMedications] remove error:', error)
    await load()
  }

  return { medications, isLoading, upsert, logDose, remove, reload: load }
}
