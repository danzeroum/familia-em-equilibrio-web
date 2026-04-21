import OpenAI from 'openai'

// Modelos disponíveis na VPS BuildToValue
export const AVAILABLE_MODELS = [
  { id: 'qwen2.5:7b',                   label: 'Qwen 2.5 7B',              recommended: true  },
  { id: 'qwen2.5-coder:7b',             label: 'Qwen 2.5 Coder 7B',        recommended: false },
  { id: 'llama3.1:8b',                  label: 'Llama 3.1 8B',             recommended: false },
  { id: 'llama3.2:latest',              label: 'Llama 3.2',                recommended: false },
  { id: 'gemma2:9b',                    label: 'Gemma 2 9B',               recommended: false },
  { id: 'mistral:latest',               label: 'Mistral',                  recommended: false },
  { id: 'deepseek-coder:6.7b-instruct', label: 'DeepSeek Coder 6.7B',      recommended: false },
] as const

export type LLMModelId = typeof AVAILABLE_MODELS[number]['id']

/**
 * Cria um client OpenAI apontando para o Ollama da VPS (via HTTPS proxy).
 *
 * O proxy BuildToValue usa autenticação HTTP Basic.
 * LLM_API_KEY deve conter o valor COMPLETO do header, ex:
 *   Basic YnVpbGR0b3ZhbHVlOkJUVl9zZWN1cmVfMjAyNiE=
 *
 * O SDK da OpenAI envia `Authorization: Bearer <apiKey>` por padrão,
 * por isso sobrescrevemos via defaultHeaders para evitar o prefixo Bearer.
 */
export function createLLMClient(_modelId?: LLMModelId) {
  const apiKey   = process.env.LLM_API_KEY ?? 'unused'
  const baseURL  = `${process.env.LLM_API_BASE}/v1`

  return new OpenAI({
    baseURL,
    // apiKey genérico (o SDK exige, mas não será usado como Bearer)
    apiKey: 'ollama',
    // Sobrescreve o Authorization padrão (Bearer) pelo valor exato da env
    defaultHeaders: {
      Authorization: apiKey,
    },
  })
}

export const DEFAULT_MODEL: LLMModelId =
  (process.env.LLM_DEFAULT_MODEL as LLMModelId) ?? 'qwen2.5:7b'
