import { NextRequest, NextResponse } from 'next/server'
import { parseUserInput } from '@/lib/chatbot-parser'
import { insertParsedItems } from '@/lib/chatbot-inserter'
import { answerQuestion, isQuestion } from '@/lib/chatbot-query'
import { LLMModelId, DEFAULT_MODEL } from '@/lib/llm-client'
import { supabaseAdmin } from '@/lib/supabase-admin'

async function getAISettings(familyId: string): Promise<{ model_id: LLMModelId; system_prompt: string | null }> {
  const { data } = await supabaseAdmin
    .from('ai_settings')
    .select('model_id, system_prompt')
    .eq('family_id', familyId)
    .maybeSingle()
  return {
    model_id: (data?.model_id as LLMModelId) ?? DEFAULT_MODEL,
    system_prompt: data?.system_prompt ?? null,
  }
}

export async function POST(req: NextRequest) {
  const { text, familyId, createdBy, autoInsert, modelId, items } = await req.json()

  if (!text || !familyId || !createdBy) {
    return NextResponse.json(
      { error: 'text, familyId e createdBy são obrigatórios' },
      { status: 400 }
    )
  }

  // Busca configurações salvas pela família (model + prompt)
  const aiSettings = await getAISettings(familyId)
  const resolvedModelId: LLMModelId = (modelId as LLMModelId) ?? aiSettings.model_id

  // ── Modo pergunta ──────────────────────────────────────────────────────────
  if (isQuestion(text) && !autoInsert) {
    try {
      const answer = await answerQuestion(
        text,
        familyId,
        resolvedModelId,
        aiSettings.system_prompt ?? undefined
      )
      return NextResponse.json({ answer, mode: 'query' })
    } catch (err: any) {
      console.error('[chatbot] Erro ao responder pergunta:', err?.message)
      return NextResponse.json(
        { error: err?.message ?? 'Erro ao consultar dados' },
        { status: 500 }
      )
    }
  }

  // ── Modo inserção ──────────────────────────────────────────────────────────
  const llmBase = process.env.LLM_API_BASE
  if (!llmBase) {
    return NextResponse.json(
      { error: 'Configuração do LLM ausente. Defina LLM_API_BASE no .env' },
      { status: 500 }
    )
  }

  try {
    if (autoInsert && Array.isArray(items) && items.length > 0) {
      const insertResult = await insertParsedItems(items, familyId, createdBy)
      return NextResponse.json({ insertResult })
    }

    const parseResult = await parseUserInput(text, resolvedModelId)

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
