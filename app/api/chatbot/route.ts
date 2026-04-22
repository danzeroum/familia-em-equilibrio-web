import { NextRequest, NextResponse } from 'next/server'
import { parseUserInput } from '@/lib/chatbot-parser'
import { insertParsedItems } from '@/lib/chatbot-inserter'
import { answerQuestion, isQuestion } from '@/lib/chatbot-query'
import { LLMModelId } from '@/lib/llm-client'

export async function POST(req: NextRequest) {
  const { text, familyId, createdBy, autoInsert, modelId, items } = await req.json()

  if (!text || !familyId || !createdBy) {
    return NextResponse.json(
      { error: 'text, familyId e createdBy são obrigatórios' },
      { status: 400 }
    )
  }

  // ── Modo pergunta: consulta o banco e responde via LLM ──────────────────
  if (isQuestion(text) && !autoInsert) {
    try {
      const answer = await answerQuestion(text, familyId, modelId as LLMModelId | undefined)
      return NextResponse.json({ answer, mode: 'query' })
    } catch (err: any) {
      console.error('[chatbot] Erro ao responder pergunta:', err?.message)
      return NextResponse.json(
        { error: err?.message ?? 'Erro ao consultar dados' },
        { status: 500 }
      )
    }
  }

  // ── Modo inserção: valida configuração do LLM ───────────────────────────
  const llmBase = process.env.LLM_API_BASE
  if (!llmBase) {
    console.error('[chatbot] LLM_API_BASE não definido nas variáveis de ambiente')
    return NextResponse.json(
      { error: 'Configuração do LLM ausente. Defina LLM_API_BASE no .env' },
      { status: 500 }
    )
  }

  try {
    // Se vieram items prontos (confirmação do preview), inserir diretamente
    if (autoInsert && Array.isArray(items) && items.length > 0) {
      const insertResult = await insertParsedItems(items, familyId, createdBy)
      return NextResponse.json({ insertResult })
    }

    // Parse do texto via LLM
    const parseResult = await parseUserInput(text, modelId as LLMModelId | undefined)

    if (!autoInsert) {
      return NextResponse.json({ preview: parseResult.items, mode: 'insert' })
    }

    const insertResult = await insertParsedItems(parseResult.items, familyId, createdBy)
    return NextResponse.json({ ...parseResult, insertResult })
  } catch (err: any) {
    console.error('[chatbot] Erro na pipeline:', err?.message ?? err)
    return NextResponse.json(
      { error: err?.message ?? 'Erro interno', detail: err?.cause ?? null },
      { status: 500 }
    )
  }
}
