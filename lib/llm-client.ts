import OpenAI from 'openai'

export const AVAILABLE_MODELS = [
  { id: 'qwen2.5-coder:7b',             label: 'Qwen 2.5 Coder 7B',         recommended: true  },
  { id: 'deepseek-coder:latest',         label: 'DeepSeek Coder (Latest)',    recommended: false },
  { id: 'deepseek-coder:6.7b-instruct',  label: 'DeepSeek Coder 6.7B',       recommended: false },
  { id: 'llama3.1:8b',                   label: 'Llama 3.1 8B',              recommended: false },
  { id: 'llama3.2:latest',               label: 'Llama 3.2 (Latest)',         recommended: false },
  { id: 'gemma2:9b',                     label: 'Gemma 2 9B',                recommended: false },
  { id: 'qwen2.5:7b',                    label: 'Qwen 2.5 7B',               recommended: false },
  { id: 'codellama:7b',                  label: 'CodeLlama 7B',              recommended: false },
  { id: 'phi3:latest',                   label: 'Phi-3 (Latest)',             recommended: false },
  { id: 'mistral:latest',                label: 'Mistral (Latest)',           recommended: false },
  { id: 'pleias-rag:1b',                 label: 'Pleias RAG 1B',             recommended: false },
  { id: 'pleias-rag:1b-broken',          label: 'Pleias RAG 1B (Broken)',    recommended: false },
  { id: 'pleias-rag:fixed',              label: 'Pleias RAG (Fixed)',         recommended: false },
  { id: 'llama3.2:3b',                   label: 'Llama 3.2 3B',              recommended: false },
] as const

export type LLMModelId = typeof AVAILABLE_MODELS[number]['id']

export function createLLMClient(_modelId?: LLMModelId) {
  const apiKey  = process.env.LLM_API_KEY ?? 'unused'
  const baseURL = `${process.env.LLM_API_BASE}/v1`

  return new OpenAI({
    baseURL,
    apiKey: 'ollama',
    defaultHeaders: {
      Authorization: apiKey,
    },
  })
}

export const DEFAULT_MODEL: LLMModelId =
  (process.env.LLM_DEFAULT_MODEL as LLMModelId) ?? 'qwen2.5-coder:7b'
