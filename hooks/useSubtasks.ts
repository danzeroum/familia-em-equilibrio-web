import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'

export function useSubtasks() {
  const { family } = useFamilyStore()
  const familyId = family?.id ?? null
  const [loading, setLoading] = useState(false)
  async function upsert(data: Record<string, any>) {
    setLoading(true)
    try {
      const { error } = await supabase.from('subtasks').upsert({ ...data, family_id: familyId })
      if (error) throw error
    } finally { setLoading(false) }
  }
  return { loading, upsert }
}
