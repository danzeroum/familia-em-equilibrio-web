'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { ShoppingItem } from '@/types/database'

export function useShoppingItems() {
  const { currentFamily } = useFamilyStore()
  const familyId = currentFamily?.id
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [familyId])

  async function load() {
    if (!familyId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('domain_id', familyId as any)
      .order('created_at', { ascending: false })
    setItems(data ?? [])
    setIsLoading(false)
  }

  async function updateStatus(id: string, status: ShoppingItem['status'], buyerId?: string) {
    const payload: Partial<ShoppingItem> = {
      status,
      bought_at: status === 'bought' ? new Date().toISOString() : null,
      bought_by: status === 'bought' && buyerId ? buyerId : null,
    }
    await supabase.from('shopping_items').update(payload).eq('id', id)
    await load()
  }

  async function upsert(item: Partial<ShoppingItem>) {
    const payload = { ...item, domain_id: item.domain_id ?? (familyId as any) }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      await supabase.from('shopping_items').update(updateData).eq('id', payload.id)
    } else {
      await supabase.from('shopping_items').insert(payload as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('shopping_items').delete().eq('id', id)
    await load()
  }

  return { items, isLoading, updateStatus, upsert, remove, reload: load }
}
