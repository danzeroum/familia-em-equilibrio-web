'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { Recipe } from '@/types/database'

export function useRecipes() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)
  const [items, setItems] = useState<Recipe[]>([])
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
      .from('recipes')
      .select('*')
      .eq('family_id', fid)
      .order('is_favorite', { ascending: false })
      .order('title', { ascending: true })
    if (error) console.error('[useRecipes] load error:', error.message)
    else setItems(data ?? [])
    setIsLoading(false)
  }

  async function upsert(item: Partial<Recipe>) {
    const fid = familyIdRef.current
    if (!fid) return
    const payload = { ...item }
    if (payload.id) {
      const { id: _id, created_at: _cat, ...updateData } = payload
      const { error } = await supabase.from('recipes').update(updateData as any).eq('id', payload.id)
      if (error) console.error('[useRecipes] update error:', error.message)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('recipes').insert({
        ...payload,
        family_id: fid,
        created_by: payload.created_by ?? user?.id ?? null,
      } as any)
      if (error) console.error('[useRecipes] insert error:', error.message)
    }
    await load()
  }

  async function toggleFavorite(id: string, value: boolean) {
    const { error } = await supabase.from('recipes').update({ is_favorite: value }).eq('id', id)
    if (error) console.error('[useRecipes] toggleFavorite error:', error.message)
    await load()
  }

  async function remove(id: string) {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) console.error('[useRecipes] remove error:', error.message)
    await load()
  }

  return { items, isLoading, upsert, toggleFavorite, remove, reload: load }
}
