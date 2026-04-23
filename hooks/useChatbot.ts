// hooks/useChatbot.ts
import { useState, useRef } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { supabase } from '@/lib/supabase'
import { ParsedItem } from '@/types/chatbot'
import { LLMModelId } from '@/lib/llm-client'

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
  streaming?: boolean   // ← true enquanto o typewriter ainda digita
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

  // Ref para cancelar typewriter em andamento se o usuário enviar nova msg
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function addMessage(role: 'user' | 'assistant', content: string) {
    setMessages(prev => [...prev, { id: genId(), role, content }])
  }

  /**
   * Adiciona uma mensagem do assistente com efeito typewriter (letra por letra).
   * Retorna uma Promise que resolve quando a animação termina.
   */
  function addAssistantStreaming(content: string): Promise<void> {
    // Cancela qualquer typewriter anterior
    if (typewriterRef.current) {
      clearInterval(typewriterRef.current)
      typewriterRef.current = null
      // Finaliza a mensagem anterior imediatamente
      setMessages(prev =>
        prev.map(m => m.streaming ? { ...m, streaming: false } : m)
      )
    }

    const id = genId()

    // Insere a mensagem vazia com streaming: true
    setMessages(prev => [...prev, { id, role: 'assistant', content: '', streaming: true }])

    return new Promise(resolve => {
      let index = 0
      const SPEED_MS = 4 // ms por caractere — reduzido para respostas mais rápidas

      typewriterRef.current = setInterval(() => {
        index += 3 // avança 3 chars por tick para mensagens longas
        const partial = content.slice(0, index)

        setMessages(prev =>
          prev.map(m => m.id === id ? { ...m, content: partial } : m)
        )

        if (index >= content.length) {
          clearInterval(typewriterRef.current!)
          typewriterRef.current = null
          // Garante conteúdo completo e remove flag streaming
          setMessages(prev =>
            prev.map(m => m.id === id ? { ...m, content, streaming: false } : m)
          )
          resolve()
        }
      }, SPEED_MS)
    })
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

      if (!res.ok) {
        await addAssistantStreaming(`❌ Erro: ${data.error ?? 'Falha desconhecida'}`)
        setLoading(false)
        return
      }

      // ── Modo pergunta: exibe resposta com typewriter ──
      if (data.mode === 'query') {
        await addAssistantStreaming(data.answer)
        setLoading(false)
        return
      }

      // ── Modo inserção: exibe preview para confirmação ──
      const items: ParsedItem[] = data.preview ?? []
      setPreview(items)
      setEditingItems(items)

      const summary = items.length > 0
        ? `Encontrei **${items.length} itens** para revisar antes de salvar.`
        : 'Não consegui identificar itens no texto. Tente reformular.'

      await addAssistantStreaming(summary)
    } catch (err: any) {
      await addAssistantStreaming(
        `❌ Erro de conexão: ${err?.message ?? 'Sem resposta do servidor'}`
      )
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

      if (!res.ok) {
        await addAssistantStreaming(`❌ Erro ao salvar: ${data.error ?? 'Falha desconhecida'}`)
        setLoading(false)
        return
      }

      const r = data.insertResult
      await addAssistantStreaming(
        `✅ **${r?.inserted ?? 0} itens salvos** com sucesso!${r?.failed ? ` ⚠️ ${r.failed} falharam.` : ''}`
      )
      setPreview(null)
      setEditingItems([])
      setLoading(false)  // ← FIX: estava faltando aqui
      return r
    } catch (err: any) {
      await addAssistantStreaming(
        `❌ Erro de conexão: ${err?.message ?? 'Sem resposta do servidor'}`
      )
    }

    setLoading(false)
  }

  function cancelPreview() {
    setPreview(null)
    setEditingItems([])
    addAssistantStreaming('Operação cancelada.')
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
