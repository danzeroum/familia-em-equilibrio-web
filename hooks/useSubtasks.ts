import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SubtaskInput {
  id?: string
  task_id?: string | null
  title: string
  is_completed?: boolean | null
  created_at?: string | null
}

export function useSubtasks() {
  const [loading, setLoading] = useState(false)

  async function upsert(data: SubtaskInput) {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('subtasks').upsert(data)
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  return { loading, upsert }
}
