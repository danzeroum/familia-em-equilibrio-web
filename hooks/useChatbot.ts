import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { createClient } from '@/lib/supabase'
import { ParsedItem } from '@/types/chatbot'
import { LLMModelId } from '@/lib/llm-client'

export function useChatbot() {
  const { familyId } = useFamilyStore()
  const [loading, setLoading]   = useState(false)
  const [preview, setPreview]   = useState<ParsedItem[] | null>(null)
  const [rawText, setRawText]   = useState('')
  const [modelId, setModelId]   = useState<LLMModelId>('qwen2.5:7b')

  async function parseText(text: string) {
    setLoading(true)
    setRawText(text)

    // Pega o user do Supabase Auth diretamente (sem authStore)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        familyId,
        createdBy: user?.id,
        autoInsert: false,
        modelId,
      }),
    })
    const data = await res.json()
    setPreview(data.preview ?? [])
    setLoading(false)
  }

  async function confirmInsert(items: ParsedItem[]) {
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: rawText,
        familyId,
        createdBy: user?.id,
        autoInsert: true,
        modelId,
      }),
    })
    const data = await res.json()
    setPreview(null)
    setLoading(false)
    return data.insertResult
  }

  return { loading, preview, setPreview, parseText, confirmInsert, modelId, setModelId }
}
