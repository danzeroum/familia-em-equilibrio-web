'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'

export interface PharmacyItem {
  id: string
  family_id: string
  name: string
  quantity: string | null
  unit: string | null
  status: 'pending' | 'bought' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | null
  notes: string | null
  assigned_to: string | null
  created_at: string
}

const STATUS_NEXT: Record<string, 'pending' | 'bought' | 'cancelled'> = {
  pending:   'bought',
  bought:    'cancelled',
  cancelled: 'pending',
}

export const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending:   { label: '⏳ Pendente',  cls: 'bg-yellow-100 text-yellow-700' },
  bought:    { label: '✅ Comprado',  cls: 'bg-green-100 text-green-700'   },
  cancelled: { label: '⏭️ Cancelado', cls: 'bg-gray-100 text-gray-500'     },
}

export const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high:   { label: '🔴 Alta',  cls: 'text-red-600'    },
  medium: { label: '🟡 Média', cls: 'text-yellow-600' },
  low:    { label: '🟢 Baixa', cls: 'text-green-600'  },
}

export function usePharmacyItems() {
  const { family } = useFamilyStore()
  const familyId = family?.id
  const [items, setItems] = useState<PharmacyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { if (familyId) load() }, [familyId])

  async function load() {
    if (!familyId) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('family_id', familyId)
      .eq('category', 'Farmácia')
      .order('created_at', { ascending: false })
    if (error) console.error('[usePharmacyItems]', error)
    setItems((data ?? []) as unknown as PharmacyItem[])
    setIsLoading(false)
  }

  async function upsert(item: Partial<PharmacyItem> & { name: string }) {
    if (!familyId) return
    const payload = {
      ...item,
      family_id: familyId,
      category: 'Farmácia',
      status: item.status ?? 'pending',
      assigned_to: item.assigned_to || null,
      priority: item.priority || null,
    }
    let error: any
    if (item.id) {
      const { id: _id, created_at: _c, family_id: _f, ...updateData } = payload as any
      ;({ error } = await supabase.from('shopping_items').update(updateData).eq('id', item.id))
    } else {
      ;({ error } = await supabase.from('shopping_items').insert(payload as any))
    }
    if (error) { console.error('[usePharmacyItems] upsert:', error); alert(`Erro: ${error.message}`); return }
    await load()
  }

  async function cycleStatus(id: string, current: string) {
    const next = STATUS_NEXT[current] ?? 'pending'
    const { error } = await supabase.from('shopping_items').update({ status: next } as any).eq('id', id)
    if (error) console.error('[usePharmacyItems] cycleStatus:', error)
    await load()
  }

  async function clearBought() {
    if (!familyId) return
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('family_id', familyId)
      .eq('category', 'Farmácia')
      .eq('status', 'bought')
    if (error) console.error('[usePharmacyItems] clearBought:', error)
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('shopping_items').delete().eq('id', id)
    if (error) console.error('[usePharmacyItems] remove:', error)
    await load()
  }

  const pending   = items.filter(i => i.status === 'pending')
  const bought    = items.filter(i => i.status === 'bought')
  const cancelled = items.filter(i => i.status === 'cancelled')

  return { items, pending, bought, cancelled, isLoading, upsert, cycleStatus, clearBought, remove, reload: load }
}
