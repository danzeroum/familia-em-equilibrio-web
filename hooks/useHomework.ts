import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'

interface HomeworkInput {
  id?: string
  profile_id?: string | null
  title: string
  subject?: string | null
  due_date?: string | null
  progress_pct?: number | null
  missing_steps?: string | null
  status?: string | null
  family_id?: string | null
  created_at?: string | null
}

export function useHomework() {
  const { family } = useFamilyStore()
  const familyId = family?.id ?? null
  const [loading, setLoading] = useState(false)

  async function upsert(data: HomeworkInput) {
    setLoading(true)
    try {
      const { error } = await supabase.from('homework').upsert({ ...data, family_id: familyId })
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  return { loading, upsert }
}
