import { createLLMClient, DEFAULT_MODEL, LLMModelId } from '@/lib/llm-client'
import { ParseResult } from '@/types/chatbot'

const SYSTEM_PROMPT = `Você é um assistente de organização doméstica brasileiro.
Analise o texto e retorne um JSON válido com esta estrutura EXATA:

{
  "items": [
    {
      "type": "shopping|task|home_maintenance|maintenance_call|calendar_event|medication|vaccine|unknown",
      "title": "string",
      "quantity": "string ou null",
      "category": "string ou null",
      "recurrence": "daily|weekly|monthly|yearly ou null",
      "recurrence_interval": número ou null,
      "location": "string ou null",
      "date": "YYYY-MM-DD ou null",
      "time": "HH:MM ou null",
      "notes": "string ou null",
      "confidence": número entre 0 e 1
    }
  ]
}

REGRAS DE CLASSIFICAÇÃO:
- shopping: item de compra (mercado, farmácia, higiene, alimento)
- task: tarefa doméstica PERIÓDICA ou única (lavar, limpar, organizar)
- home_maintenance: rotina de conservação com frequência (lavar cortina 1x/mês)
- maintenance_call: reparo pontual ESTRUTURAL (fixar, instalar, arrumar algo quebrado)
- calendar_event: evento com data/hora (pegar bolo sábado 13h30, consulta, reunião)
- medication: remédio, soro, seringa, curativo, cotonete
- vaccine: vacina

REGRAS DE EXTRAÇÃO:
- "1x por semana" → recurrence:"weekly", recurrence_interval:1
- "todo dia" / "diário" → recurrence:"daily", recurrence_interval:1
- "1x por mês" → recurrence:"monthly", recurrence_interval:1
- Detecte cômodo para maintenance_call: "Banheiros:" → location:"Banheiro"
- "2 gorgonzola" → quantity:"2", title:"Gorgonzola"
- Remédio que precisa ser comprado → type:"medication" (não shopping)
- "Sábado" sem data específica = próximo sábado

REGRAS DE CATEGORIA PARA ITENS DE COMPRA (campo "category"):
Quando type="shopping", defina category com base no conteúdo do item:
- "grocery"   → alimentos, bebidas, ingredientes, frutas, verduras, grãos, laticiníos, carnes, temperos
              Exemplos: abacaxi, melancia, fubá, espinafre, café, shoyu, iogurte, sorvete, requeijão
- "pharmacy"  → itens de farmácia sem receita, higiene pessoal, fraldas, curativos
              Exemplos: fralda, lenço umedecido, cotonete, sabonete líquido, shampoo
- "home"      → utilidades domésticas, limpeza, organização
              Exemplos: ralo, varal, lâmpada, pano de prato, saco de lixo
- "education" → material escolar, livros, papelaria
              Exemplos: caderno, caneta, mochila, livro didático
- null        → quando não for possível determinar a categoria

Retorne APENAS o JSON, sem texto adicional, sem markdown, sem explicações.`

export async function parseUserInput(
  rawText: string,
  modelId?: LLMModelId
): Promise<ParseResult> {
  const client = createLLMClient(modelId)
  const model  = modelId ?? DEFAULT_MODEL

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: rawText },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  })

  const raw = response.choices[0].message.content ?? '{}'

  let parsed: { items?: unknown[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    console.error('[chatbot-parser] JSON inválido recebido:', raw)
    parsed = { items: [] }
  }

  const items = (parsed.items ?? []).map(sanitizeItem)

  return { items, rawText, parsedAt: new Date().toISOString() }
}

function sanitizeItem(raw: any) {
  return {
    type:                 raw.type                ?? 'unknown',
    title:                raw.title               ?? '',
    quantity:             raw.quantity            ?? null,
    category:             raw.category            ?? null,
    recurrence:           raw.recurrence          ?? null,
    recurrence_interval:  raw.recurrence_interval ?? null,
    location:             raw.location            ?? null,
    date:                 raw.date                ?? null,
    time:                 raw.time                ?? null,
    notes:                raw.notes               ?? null,
    confidence:           typeof raw.confidence === 'number' ? raw.confidence : 0.5,
  }
}
