import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SchoolItemInput {
  id?: string
  profile_id?: string | null
  name: string
  status?: string | null
  due_date?: string | null
  quantity?: string | null
  notes?: string | null
  created_at?: string | null
}

export function useSchoolItems() {
  const [loading, setLoading] = useState(false)

  async function upsert(data: SchoolItemInput) {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('school_items').upsert(data)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  return { loading, upsert }
}
