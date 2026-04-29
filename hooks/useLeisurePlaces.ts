'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import type { LeisurePlace } from '@/types/database'

export function useLeisurePlaces() {
  const familyId = useFamilyStore((s) => s.currentFamily?.id)

  const [places, setPlaces] = useState<LeisurePlace[]>([])
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
      .from('leisure_places')
      .select('*')
      .eq('family_id', fid)
      .order('is_favorite', { ascending: false })
      .order('visited_count', { ascending: false })
    if (error) console.error('[useLeisurePlaces] load error:', error.message)
    setPlaces(data ?? [])
    setIsLoading(false)
  }

  async function upsert(place: Partial<LeisurePlace> & { name: string }) {
    const fid = familyIdRef.current
    if (!fid) return
    if (place.id) {
      const { id: _id, created_at: _cat, ...updateData } = place
      await supabase.from('leisure_places').update(updateData).eq('id', place.id)
    } else {
      await supabase.from('leisure_places').insert({ ...place, family_id: fid } as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('leisure_places').delete().eq('id', id)
    await load()
  }

  async function toggleFavorite(id: string, current: boolean) {
    await supabase.from('leisure_places').update({ is_favorite: !current }).eq('id', id)
    await load()
  }

  async function incrementVisited(id: string, currentCount: number) {
    await supabase
      .from('leisure_places')
      .update({ visited_count: currentCount + 1 })
      .eq('id', id)
    await load()
  }

  const favorites = places.filter(p => p.is_favorite)

  return { places, favorites, isLoading, upsert, remove, toggleFavorite, incrementVisited, reload: load }
}
