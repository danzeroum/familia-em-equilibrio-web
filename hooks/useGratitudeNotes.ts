import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface GratitudeNoteInput {
  id?: string
  from_user_id?: string | null
  to_user_id?: string | null
  message: string
  created_at?: string | null
}

export function useGratitudeNotes() {
  const [loading, setLoading] = useState(false)

  async function upsert(data: GratitudeNoteInput) {
    setLoading(true)
    try {
      const { error } = await supabase.from('gratitude_notes').upsert(data)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  return { loading, upsert }
}
