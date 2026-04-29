import { create } from 'zustand'
import { AVAILABLE_MODELS, DEFAULT_MODEL, type LLMModelId } from '@/lib/llm-client'
import type { ParsedItem } from '@/types/chatbot'

interface ChatbotStore {
  selectedModel: LLMModelId
  preview: ParsedItem[] | null
  rawText: string
  loading: boolean
  lastModelUsed: string | null
  setModel: (model: LLMModelId) => void
  setPreview: (items: ParsedItem[] | null) => void
  setLoading: (v: boolean) => void
  setRawText: (text: string) => void
  setLastModelUsed: (model: string) => void
}

export const useChatbotStore = create<ChatbotStore>((set) => ({
  selectedModel:  DEFAULT_MODEL,
  preview:        null,
  rawText:        '',
  loading:        false,
  lastModelUsed:  null,

  setModel:         (selectedModel)  => set({ selectedModel }),
  setPreview:       (preview)        => set({ preview }),
  setLoading:       (loading)        => set({ loading }),
  setRawText:       (rawText)        => set({ rawText }),
  setLastModelUsed: (lastModelUsed)  => set({ lastModelUsed }),
}))

export { AVAILABLE_MODELS }
