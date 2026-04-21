import { useState } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { supabase } from '@/lib/supabase'
import { ParsedItem } from '@/types/chatbot'
import { LLMModelId } from '@/lib/llm-client'

// crypto.randomUUID só funciona em HTTPS — fallback para HTTP
function genId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function useChatbot() {
  const { family, currentUser } = useFamilyStore()
  const familyId = family?.id ?? null

  const [loading, setLoading]           = useState(false)
  const [preview, setPreview]           = useState<ParsedItem[] | null>(null)
  const [editingItems, setEditingItems] = useState<ParsedItem[]>([])
  const [messages, setMessages]         = useState<ChatMessage[]>([])
  const [rawText, setRawText]           = useState('')
  const [modelId, setModelId]           = useState<LLMModelId>('qwen2.5:7b')

  function addMessage(role: 'user' | 'assistant', content: string) {
    setMessages(prev => [...prev, { id: genId(), role, content }])
  }

  async function analyzeText(text: string) {
    setLoading(true)
    setRawText(text)
    addMessage('user', text)

    const { data: { user } } = await supabase.auth.getUser()

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          familyId,
          createdBy: user?.id ?? currentUser?.id,
          autoInsert: false,
          modelId,
        }),
      })
      const data = await res.json()
      const items: ParsedItem[] = data.preview ?? []
      setPreview(items)
      setEditingItems(items)

      const summary = items.length > 0
        ? `Encontrei **${items.length} itens** para revisar antes de salvar.`
        : 'Não consegui identificar itens no texto. Tente reformular.'
      addMessage('assistant', summary)
    } catch {
      addMessage('assistant', 'Erro ao analisar o texto. Tente novamente.')
    }

    setLoading(false)
  }

  async function confirmInsert(items: ParsedItem[]) {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawText,
          familyId,
          createdBy: user?.id ?? currentUser?.id,
          autoInsert: true,
          modelId,
          items,
        }),
      })
      const data = await res.json()
      const r = data.insertResult
      addMessage(
        'assistant',
        `✅ **${r?.inserted ?? 0} itens salvos** com sucesso!${r?.failed ? ` ⚠️ ${r.failed} falharam.` : ''}`
      )
      setPreview(null)
      setEditingItems([])
      return r
    } catch {
      addMessage('assistant', 'Erro ao salvar os itens. Tente novamente.')
    }

    setLoading(false)
  }

  function cancelPreview() {
    setPreview(null)
    setEditingItems([])
    addMessage('assistant', 'Operação cancelada.')
  }

  function removeEditingItem(index: number) {
    setEditingItems(prev => prev.filter((_, i) => i !== index))
  }

  function updateEditingItem(index: number, updates: Partial<ParsedItem>) {
    setEditingItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    )
  }

  return {
    loading,
    preview,
    setPreview,
    editingItems,
    messages,
    analyzeText,
    confirmInsert,
    cancelPreview,
    removeEditingItem,
    updateEditingItem,
    modelId,
    setModelId,
  }
}
