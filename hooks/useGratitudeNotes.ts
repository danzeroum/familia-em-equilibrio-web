import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'

export function useGratitudeNotes() {
  const { family } = useFamilyStore()
  const familyId = family?.id ?? null
  const [loading, setLoading] = useState(false)

  async function upsert(data: Record<string, any>) {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('gratitude_notes')
        .upsert({ ...data, family_id: familyId })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  return { loading, upsert }
}
