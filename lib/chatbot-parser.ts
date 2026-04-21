import { createLLMClient, DEFAULT_MODEL, type LLMModelId } from './llm-client'
import type { ParseResult, ParsedItem } from '@/types/chatbot'

const SYSTEM_PROMPT = `Você é um assistente de organização doméstica para uma família brasileira.
Analise o texto e classifique CADA item em uma categoria. Responda APENAS com JSON válido, sem texto antes ou depois.

Categorias disponíveis:
- "shopping": item de compra (mercado, farmácia, higiene, alimentos)
- "task": tarefa doméstica com ou sem recorrência
- "home_maintenance": reparo ou manutenção recorrente da casa (ex: lâmpadas, limpeza de cortinas)
- "maintenance_call": conserto pontual que precisa ser feito uma vez (ex: fixar torneira, arrumar tomada)
- "family_event": evento com data/hora específica
- "medication": remédio, suplemento ou item de saúde pessoal
- "pantry": alimento/ingrediente para estoque da despensa

Formato obrigatório da resposta:
{
  "items": [
    {
      "type": "shopping",
      "title": "Nome do item",
      "quantity": "2" ou null,
      "category": "farmácia" ou null,
      "recurrence": "1x por semana" ou null,
      "location": "Banheiro" ou null,
      "date": "2026-04-26" ou null,
      "time": "13:30" ou null,
      "notes": "observação" ou null
    }
  ]
}`

// Extrai JSON mesmo se o modelo colocar texto ao redor
function extractJSON(raw: string): any {
  // Tenta parse direto
  try { return JSON.parse(raw) } catch {}
  // Busca bloco ```json ... ```
  const fence = raw.match(/```json\s*([\s\S]*?)\s*```/)
  if (fence) try { return JSON.parse(fence[1]) } catch {}
  // Busca primeiro { ... } balanceado
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(raw.slice(start, end + 1)) } catch {}
  }
  return null
}

export async function parseUserInput(
  rawText: string,
  modelId: LLMModelId = DEFAULT_MODEL
): Promise<ParseResult> {
  const client = createLLMClient(modelId)

  const response = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: rawText },
    ],
    temperature: 0.1,
    // Sem response_format — Ollama não suporta json_schema strict
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  const parsed = extractJSON(raw)

  if (!parsed?.items) {
    console.error('[chatbot-parser] Resposta inválida do modelo:', raw)
    return { items: [], rawText, parsedAt: new Date().toISOString(), modelUsed: modelId }
  }

  // Adiciona confidence padrão se o modelo omitir
  const items: ParsedItem[] = parsed.items.map((item: any) => ({
    ...item,
    confidence: item.confidence ?? 0.8,
  }))

  return { items, rawText, parsedAt: new Date().toISOString(), modelUsed: modelId }
}
