import OpenAI from 'openai'

// Modelos disponíveis na VPS
export const AVAILABLE_MODELS = [
  { id: 'qwen2.5:7b',                label: 'Qwen 2.5 7B',           recommended: true },
  { id: 'llama3.1:8b',               label: 'Llama 3.1 8B',          recommended: false },
  { id: 'llama3.2:latest',           label: 'Llama 3.2',             recommended: false },
  { id: 'gemma2:9b',                 label: 'Gemma 2 9B',            recommended: false },
  { id: 'mistral:latest',            label: 'Mistral',               recommended: false },
  { id: 'deepseek-coder:6.7b-instruct', label: 'DeepSeek Coder 6.7B', recommended: false },
] as const

export type LLMModelId = typeof AVAILABLE_MODELS[number]['id']

// Cria um client OpenAI apontando para a VPS Ollama
export function createLLMClient(modelId?: LLMModelId) {
  return new OpenAI({
    baseURL: `${process.env.LLM_API_BASE}/v1`,   // Ollama expõe /v1/chat/completions
    apiKey:  process.env.LLM_API_KEY ?? 'unused', // Header Authorization Basic
    defaultHeaders: {
      Authorization: process.env.LLM_API_KEY ?? '',
    },
    defaultQuery: undefined,
  })
}

export const DEFAULT_MODEL: LLMModelId =
  (process.env.LLM_DEFAULT_MODEL as LLMModelId) ?? 'qwen2.5:7b'
