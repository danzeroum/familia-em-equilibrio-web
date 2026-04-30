'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { AVAILABLE_MODELS, DEFAULT_MODEL, type LLMModelId, type LLMProvider } from '@/lib/llm-client'

export const DEFAULT_PROMPT = `Você é um assistente doméstico familiar inteligente e simpático.
Responda perguntas sobre a organização da família de forma direta, clara e amigável em português brasileiro.
Use emojis quando apropriado. Seja conciso mas completo.
Quando listar itens, use bullets ou numeração.
Se os dados estiverem vazios, diga que não há registros e sugira adicionar.`

export interface AISettings {
  model_id: LLMModelId
  system_prompt: string
  provider: LLMProvider
  api_key: string
  max_history_messages: number
}

export function useAISettings(familyId: string | null) {
  const [settings, setSettings] = useState<AISettings>({
    model_id: DEFAULT_MODEL,
    system_prompt: DEFAULT_PROMPT,
    provider: 'ollama',
    api_key: '',
    max_history_messages: 10,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    if (!familyId) { setIsLoading(false); return }
    setIsLoading(true)
    const { data } = await supabase
      .from('ai_settings')
      .select('model_id, system_prompt, provider, api_key, max_history_messages')
      .eq('family_id', familyId)
      .maybeSingle()
    if (data) {
      setSettings({
        model_id: (data.model_id as LLMModelId) ?? DEFAULT_MODEL,
        system_prompt: data.system_prompt ?? DEFAULT_PROMPT,
        provider: (data.provider as LLMProvider) ?? 'ollama',
        api_key: data.api_key ?? '',
        max_history_messages: data.max_history_messages ?? 10,
      })
    }
    setIsLoading(false)
  }, [familyId])

  useEffect(() => { load() }, [load])

  async function save(updates: Partial<AISettings>) {
    if (!familyId) return
    setIsSaving(true)
    const next = { ...settings, ...updates }
    const payload = {
      family_id: familyId,
      model_id: next.model_id,
      system_prompt: next.system_prompt,
      provider: next.provider,
      api_key: next.api_key || null,
      max_history_messages: next.max_history_messages,
      updated_at: new Date().toISOString(),
    }
    await supabase.from('ai_settings').upsert(payload, { onConflict: 'family_id' })
    setSettings(next)
    setIsSaving(false)
  }

  return { settings, isLoading, isSaving, save, DEFAULT_PROMPT, AVAILABLE_MODELS }
}
