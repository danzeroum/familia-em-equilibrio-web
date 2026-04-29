'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { WardrobeItem } from '@/types/database'

export interface WardrobeItemWithAlert extends WardrobeItem {
  needsRestock: boolean
}

export function useWardrobe(profileId?: string) {
  const [items, setItems] = useState<WardrobeItemWithAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => { load() }, [profileId])

  async function load() {
    setIsLoading(true)
    let query = supabase.from('wardrobe_items').select('*').order('season')
    if (profileId) query = query.eq('profile_id', profileId)

    const { data } = await query
    setItems(
      (data ?? []).map((w) => ({
        ...w,
        needsRestock: w.quantity < (w.minimum_quantity ?? 1),
      }))
    )
    setIsLoading(false)
  }

  async function upsert(item: Partial<WardrobeItem> & { item_type: string }) {
    if (item.id) {
      const { id: _id, created_at: _cat, ...updateData } = item
      await supabase.from('wardrobe_items').update(updateData).eq('id', item.id)
    } else {
      await supabase.from('wardrobe_items').insert(item as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('wardrobe_items').delete().eq('id', id)
    await load()
  }

  return { items, isLoading, upsert, remove, reload: load }
}
