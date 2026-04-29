'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { LeisurePlace } from '@/types/database'

export function useLeisurePlaces() {
  const supabase = createClient()
  const { currentUser } = useFamilyStore()
  const [items, setItems] = useState<LeisurePlace[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const familyId = currentUser?.family_id

  const load = useCallback(async () => {
    if (!familyId) return
    setIsLoading(true)
    const { data } = await supabase
      .from('leisure_places')
      .select('*')
      .eq('family_id', familyId)
      .order('is_favorite', { ascending: false })
      .order('name')
    setItems(data ?? [])
    setIsLoading(false)
  }, [familyId])

  useEffect(() => { load() }, [load])

  const upsert = async (payload: Partial<LeisurePlace>) => {
    if (!familyId) return
    if (payload.id) {
      await supabase.from('leisure_places').update(payload).eq('id', payload.id)
    } else {
      await supabase.from('leisure_places').insert({ ...payload, family_id: familyId })
    }
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('leisure_places').delete().eq('id', id)
    load()
  }

  const toggleFavorite = async (place: LeisurePlace) => {
    await supabase
      .from('leisure_places')
      .update({ is_favorite: !place.is_favorite })
      .eq('id', place.id)
    load()
  }

  const incrementVisited = async (place: LeisurePlace) => {
    await supabase
      .from('leisure_places')
      .update({ visited_count: place.visited_count + 1 })
      .eq('id', place.id)
    load()
  }

  return { items, isLoading, upsert, remove, toggleFavorite, incrementVisited, reload: load }
}
