import OpenAI from 'openai'

export type LLMProvider = 'ollama' | 'deepseek'

export const AVAILABLE_MODELS = [
  // ── Ollama (local) ─────────────────────────────────────────────────────────
  { id: 'qwen2.5-coder:7b',             label: 'Qwen 2.5 Coder 7B',         provider: 'ollama'   as LLMProvider, recommended: true  },
  { id: 'deepseek-coder:latest',         label: 'DeepSeek Coder (Latest)',    provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'deepseek-coder:6.7b-instruct',  label: 'DeepSeek Coder 6.7B',       provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'llama3.1:8b',                   label: 'Llama 3.1 8B',              provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'llama3.2:latest',               label: 'Llama 3.2 (Latest)',         provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'gemma2:9b',                     label: 'Gemma 2 9B',                provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'qwen2.5:7b',                    label: 'Qwen 2.5 7B',               provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'codellama:7b',                  label: 'CodeLlama 7B',              provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'phi3:latest',                   label: 'Phi-3 (Latest)',             provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'mistral:latest',                label: 'Mistral (Latest)',           provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'pleias-rag:1b',                 label: 'Pleias RAG 1B',             provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'pleias-rag:fixed',              label: 'Pleias RAG (Fixed)',         provider: 'ollama'   as LLMProvider, recommended: false },
  { id: 'llama3.2:3b',                   label: 'Llama 3.2 3B',              provider: 'ollama'   as LLMProvider, recommended: false },
  // ── DeepSeek API (cloud) ────────────────────────────────────────────────────
  { id: 'deepseek-chat',                 label: 'DeepSeek V3 (Chat)',         provider: 'deepseek' as LLMProvider, recommended: false },
  { id: 'deepseek-reasoner',             label: 'DeepSeek R1 (Reasoner)',     provider: 'deepseek' as LLMProvider, recommended: false },
] as const

export type LLMModelId = typeof AVAILABLE_MODELS[number]['id']

/** Retorna o provider para um dado model ID */
export function getModelProvider(modelId: LLMModelId): LLMProvider {
  const found = AVAILABLE_MODELS.find(m => m.id === modelId)
  return (found?.provider as LLMProvider) ?? 'ollama'
}

export interface LLMClientOptions {
  /** Override do provider (calculado a partir do modelId se omitido) */
  provider?: LLMProvider
  /** API key para providers externos (ex: DeepSeek cloud) */
  apiKey?: string | null
}

export function createLLMClient(_modelId?: LLMModelId, opts?: LLMClientOptions): OpenAI {
  const provider = opts?.provider ?? (_modelId ? getModelProvider(_modelId) : 'ollama')

  if (provider === 'deepseek') {
    return new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: opts?.apiKey ?? '',
    })
  }

  // Default: Ollama (local)
  const apiKey  = process.env.LLM_API_KEY ?? 'unused'
  const baseURL = `${process.env.LLM_API_BASE}/v1`
  return new OpenAI({
    baseURL,
    apiKey: 'ollama',
    defaultHeaders: { Authorization: apiKey },
  })
}

export const DEFAULT_MODEL: LLMModelId =
  (process.env.LLM_DEFAULT_MODEL as LLMModelId) ?? 'qwen2.5-coder:7b'
