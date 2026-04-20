'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { ShoppingItem } from '@/types/database'

export function useGroceryItems() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const familyIdRef = useRef(familyId)
  useEffect(() => { familyIdRef.current = familyId }, [familyId])

  useEffect(() => {
    if (!familyId) return
    load()
  }, [familyId])

  async function load() {
    const fid = familyIdRef.current
    if (!fid) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from('shopping_items')
      .select('*')
      .eq('family_id', fid)
      .eq('category', 'grocery')
      .order('created_at', { ascending: false })
    if (error) console.error('[useGroceryItems] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function bulkInsert(names: string[]) {
    const fid = familyIdRef.current
    if (!fid) return
    const clean = names.map(n => n.trim()).filter(Boolean)
    if (clean.length === 0) return
    const { data: { user } } = await supabase.auth.getUser()
    const rows = clean.map(name => ({
      name,
      family_id: fid,
      category: 'grocery',
      status: 'needed' as const,
      is_bought: false,
      is_recurring: false,
      requested_by: user?.id ?? null,
    }))
    const { error } = await supabase.from('shopping_items').insert(rows as any)
    if (error) console.error('[useGroceryItems] bulkInsert error:', error.message)
    await load()
  }

  async function updateStatus(id: string, status: ShoppingItem['status'], buyerId?: string) {
    const payload = {
      status,
      bought_at: status === 'bought' ? new Date().toISOString() : null,
      bought_by: status === 'bought' && buyerId ? buyerId : null,
    }
    await supabase.from('shopping_items').update(payload).eq('id', id)
    await load()
  }

  async function upsert(item: Partial<ShoppingItem>) {
    const fid = familyIdRef.current
    const payload = { ...item, category: 'grocery' }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      await supabase.from('shopping_items').update(updateData).eq('id', payload.id)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('shopping_items').insert({
        ...payload,
        family_id: fid,
        requested_by: payload.requested_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useGroceryItems] upsert error:', error.message)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('shopping_items').delete().eq('id', id)
    await load()
  }

  async function clearBought() {
    const fid = familyIdRef.current
    if (!fid) return
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('family_id', fid)
      .eq('category', 'grocery')
      .eq('status', 'bought')
      .eq('is_recurring', false)
    if (error) console.error('[useGroceryItems] clearBought error:', error.message)
    await load()
  }

  async function clearAll() {
    const fid = familyIdRef.current
    if (!fid) return
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('family_id', fid)
      .eq('category', 'grocery')
    if (error) console.error('[useGroceryItems] clearAll error:', error.message)
    await load()
  }

  return { items, isLoading, bulkInsert, updateStatus, upsert, remove, clearBought, clearAll, reload: load }
}
