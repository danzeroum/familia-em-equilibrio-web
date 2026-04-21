// lib/chatbot-parser.ts
import OpenAI from 'openai'
import { ParseResult } from '@/types/chatbot'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Você é um assistente de organização doméstica para famílias brasileiras.
Analise o texto recebido — que pode ser uma lista do WhatsApp, notas ou mensagens misturadas — e classifique cada item em uma das categorias abaixo.

CATEGORIAS:
- shopping: item para comprar (mercado, farmácia, higiene, alimentos, etc.)
- task: tarefa doméstica (limpar, organizar, lavar, cozinhar, etc.)
- home_maintenance: manutenção recorrente da casa (verificar lâmpadas, desentupir, etc.)
- maintenance_call: reparo pontual que precisa de chamado/conserto físico (fixar torneira, arrumar tomada, instalar algo)
- calendar_event: evento com data/hora específica mencionada
- medication: remédio, medicamento, suplemento, item de saúde da farmácia
- vaccine: vacina

REGRAS:
1. Para shopping: extraia quantidade quando mencionada (ex: "2 gorgonzola" → quantity: "2", "4 seringas de 10ml" → quantity: "4", title: "Seringas 10ml")
2. Para tasks: detecte recorrência (ex: "1x por semana", "todo dia", "diário")
3. Para maintenance_call: use o campo "location" para o cômodo (ex: "Banheiro", "Escritório", "Quintal")
4. Para calendar_event: extraia data e hora no campo "date" e "time" separados
5. Itens de farmácia SEM indicação de dosagem → shopping. COM dosagem/uso médico → medication
6. Ignore preços (R$ ...), nomes de pessoas (ex: "Mariana Chernow"), timestamps de WhatsApp ([13:25, 21/04/2026])
7. Se não conseguir classificar com confiança > 0.5 → use "unknown"
8. Não duplique itens, consolide se o mesmo aparecer duas vezes
9. confidence deve ser entre 0 e 1

Responda APENAS com o JSON estruturado, sem texto adicional.`

const RESPONSE_SCHEMA = {
  type: 'json_schema',
  json_schema: {
    name: 'parse_result',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: [
                  'shopping',
                  'task',
                  'home_maintenance',
                  'maintenance_call',
                  'calendar_event',
                  'medication',
                  'vaccine',
                  'unknown',
                ],
              },
              title: { type: 'string' },
              quantity: { type: ['string', 'null'] },
              category: { type: ['string', 'null'] },
              recurrence: { type: ['string', 'null'] },
              location: { type: ['string', 'null'] },
              date: { type: ['string', 'null'] },
              time: { type: ['string', 'null'] },
              notes: { type: ['string', 'null'] },
              confidence: { type: 'number' },
            },
            required: [
              'type',
              'title',
              'confidence',
              'quantity',
              'category',
              'recurrence',
              'location',
              'date',
              'time',
              'notes',
            ],
            additionalProperties: false,
          },
        },
      },
      required: ['items'],
      additionalProperties: false,
    },
  },
}

export async function parseUserInput(rawText: string): Promise<ParseResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: rawText },
    ],
    response_format: RESPONSE_SCHEMA as Parameters<
      typeof openai.chat.completions.create
    >[0]['response_format'],
    temperature: 0.1,
  })

  const content = response.choices[0].message.content
  if (!content) throw new Error('OpenAI retornou resposta vazia')

  const parsed = JSON.parse(content)

  return {
    items: parsed.items,
    rawText,
    parsedAt: new Date().toISOString(),
  }
}
