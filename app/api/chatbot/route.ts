import { NextRequest, NextResponse } from 'next/server'
import { parseUserInput } from '@/lib/chatbot-parser'
import { insertParsedItems } from '@/lib/chatbot-inserter'
import { LLMModelId } from '@/lib/llm-client'

export async function POST(req: NextRequest) {
  const { text, familyId, createdBy, autoInsert, modelId } = await req.json()

  if (!text || !familyId || !createdBy) {
    return NextResponse.json(
      { error: 'text, familyId e createdBy são obrigatórios' },
      { status: 400 }
    )
  }

  // Valida configuração do LLM antes de tentar
  const llmBase = process.env.LLM_API_BASE
  if (!llmBase) {
    console.error('[chatbot] LLM_API_BASE não definido nas variáveis de ambiente')
    return NextResponse.json(
      { error: 'Configuração do LLM ausente. Defina LLM_API_BASE no .env' },
      { status: 500 }
    )
  }

  try {
    const parseResult = await parseUserInput(text, modelId as LLMModelId | undefined)

    if (!autoInsert) {
      return NextResponse.json({ preview: parseResult.items })
    }

    const insertResult = await insertParsedItems(
      parseResult.items,
      familyId,
      createdBy
    )

    return NextResponse.json({ ...parseResult, insertResult })
  } catch (err: any) {
    // Log completo no servidor + mensagem útil para o cliente
    console.error('[chatbot] Erro na pipeline:', err?.message ?? err)
    return NextResponse.json(
      {
        error: err?.message ?? 'Erro interno',
        detail: err?.cause ?? null,
      },
      { status: 500 }
    )
  }
}
