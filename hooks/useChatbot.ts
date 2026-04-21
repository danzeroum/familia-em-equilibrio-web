// hooks/useChatbot.ts
'use client'

import { useState, useCallback } from 'react'
import { useFamilyStore } from '@/store/familyStore'
import { ParsedItem, ChatMessage, InsertResult } from '@/types/chatbot'

export function useChatbot() {
  const { familyId, currentUser } = useFamilyStore()

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Olá! Cole uma lista ou texto com tarefas, compras, remédios ou manutenções. Vou classificar tudo automaticamente e você confirma antes de salvar. 🏠',
      timestamp: new Date().toISOString(),
    },
  ])
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<ParsedItem[] | null>(null)
  const [pendingText, setPendingText] = useState('')
  const [editingItems, setEditingItems] = useState<ParsedItem[]>([])

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `msg-${Date.now()}-${Math.random()}` },
    ])
  }, [])

  // Passo 1: Analisar texto (sem salvar)
  const analyzeText = useCallback(
    async (text: string) => {
      if (!text.trim() || !familyId) return

      setPendingText(text)
      setLoading(true)

      addMessage({ role: 'user', content: text, timestamp: new Date().toISOString() })

      try {
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, familyId, autoInsert: false }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Erro ao analisar')
        }

        const data = await res.json()
        const items: ParsedItem[] = data.preview

        setPreview(items)
        setEditingItems(items)

        const grouped = items.reduce<Record<string, number>>((acc, i) => {
          acc[i.type] = (acc[i.type] ?? 0) + 1
          return acc
        }, {})

        const resumo = Object.entries(grouped)
          .map(([type, count]) => `${count} ${type === 'shopping' ? 'compra(s)' : type === 'task' ? 'tarefa(s)' : type === 'home_maintenance' ? 'manutenção(ões)' : type === 'maintenance_call' ? 'chamado(s)' : type === 'calendar_event' ? 'evento(s)' : type === 'medication' ? 'medicamento(s)' : type === 'vaccine' ? 'vacina(s)' : 'item(ns) não identificado(s)'}`)
          .join(', ')

        addMessage({
          role: 'assistant',
          content: `Encontrei **${items.length} itens**: ${resumo}. Revise abaixo e clique em **Confirmar e Salvar** quando estiver pronto.`,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        addMessage({
          role: 'assistant',
          content: `❌ Erro ao analisar: ${msg}`,
          timestamp: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    },
    [familyId, addMessage]
  )

  // Passo 2: Confirmar e salvar
  const confirmInsert = useCallback(
    async (itemsToInsert: ParsedItem[]) => {
      if (!familyId) return

      setLoading(true)

      try {
        const res = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: pendingText,
            familyId,
            createdBy: currentUser?.id ?? null,
            autoInsert: true,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error ?? 'Erro ao salvar')
        }

        const data: { insertResult: InsertResult } = await res.json()
        const { inserted, failed, errors } = data.insertResult

        addMessage({
          role: 'assistant',
          content:
            failed === 0
              ? `✅ Tudo certo! **${inserted} itens** salvos com sucesso.`
              : `⚠️ **${inserted} itens** salvos. ${failed} falharam:\n${errors.map((e) => `• ${e}`).join('\n')}`,
          insertResult: data.insertResult,
          timestamp: new Date().toISOString(),
        })

        setPreview(null)
        setEditingItems([])
        setPendingText('')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        addMessage({
          role: 'assistant',
          content: `❌ Erro ao salvar: ${msg}`,
          timestamp: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    },
    [familyId, currentUser, pendingText, addMessage]
  )

  const cancelPreview = useCallback(() => {
    setPreview(null)
    setEditingItems([])
    setPendingText('')
    addMessage({
      role: 'assistant',
      content: '🗑️ Análise descartada. Pode enviar um novo texto quando quiser.',
      timestamp: new Date().toISOString(),
    })
  }, [addMessage])

  const removeEditingItem = useCallback((index: number) => {
    setEditingItems((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateEditingItem = useCallback((index: number, updates: Partial<ParsedItem>) => {
    setEditingItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    )
  }, [])

  return {
    messages,
    loading,
    preview,
    editingItems,
    analyzeText,
    confirmInsert,
    cancelPreview,
    removeEditingItem,
    updateEditingItem,
  }
}
