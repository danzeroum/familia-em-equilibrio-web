import { NextRequest, NextResponse } from 'next/server'
import { parseUserInput } from '@/lib/chatbot-parser'
import { insertParsedItems } from '@/lib/chatbot-inserter'
import { answerQuestion, isQuestion, type HistoryMessage } from '@/lib/chatbot-query'
import { LLMModelId, DEFAULT_MODEL } from '@/lib/llm-client'
import { supabaseAdmin } from '@/lib/supabase-admin'

type AiSettingsRow = {
  model_id: string
  system_prompt: string | null
  provider: string | null
  api_key: string | null
  max_history_messages: number | null
}

async function getAISettings(familyId: string) {
  const { data } = await supabaseAdmin
    .from('ai_settings')
    .select('model_id, system_prompt, provider, api_key, max_history_messages')
    .eq('family_id', familyId)
    .maybeSingle() as { data: AiSettingsRow | null }
  return {
    model_id: (data?.model_id as LLMModelId) ?? DEFAULT_MODEL,
    system_prompt: data?.system_prompt ?? null,
    provider: data?.provider ?? 'ollama',
    api_key: data?.api_key ?? null,
    max_history_messages: data?.max_history_messages ?? 10,
  }
}

export async function POST(req: NextRequest) {
  const { text, familyId, createdBy, autoInsert, modelId, items, history } = await req.json()

  if (!text || !familyId || !createdBy) {
    return NextResponse.json(
      { error: 'text, familyId e createdBy são obrigatórios' },
      { status: 400 }
    )
  }

  const aiSettingsPromise = getAISettings(familyId)

  if (isQuestion(text) && !autoInsert) {
    try {
      const aiSettings = await aiSettingsPromise
      const resolvedModelId: LLMModelId = (modelId as LLMModelId) ?? aiSettings.model_id
      const stream = await answerQuestion(
        text,
        familyId,
        resolvedModelId,
        aiSettings.system_prompt ?? undefined,
        aiSettings.api_key,
        (history as HistoryMessage[] | undefined) ?? [],
        aiSettings.max_history_messages,
      )
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Chatbot-Mode': 'query',
          'Cache-Control': 'no-cache, no-transform',
        },
      })
    } catch (err: any) {
      console.error('[chatbot] Erro ao responder pergunta:', err?.message)
      return NextResponse.json(
        { error: err?.message ?? 'Erro ao consultar dados' },
        { status: 500 }
      )
    }
  }

  const aiSettings = await aiSettingsPromise
  const resolvedModelId: LLMModelId = (modelId as LLMModelId) ?? aiSettings.model_id

  const llmBase = process.env.LLM_API_BASE
  if (!llmBase && aiSettings.provider === 'ollama') {
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
      // Parser não achou itens estruturáveis → não é uma lista para salvar.
      // Trata como pergunta livre e deixa o LLM responder em streaming.
      if (!parseResult.items || parseResult.items.length === 0) {
        const stream = await answerQuestion(
          text,
          familyId,
          resolvedModelId,
          aiSettings.system_prompt ?? undefined,
          aiSettings.api_key
        )
        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Chatbot-Mode': 'query',
            'Cache-Control': 'no-cache, no-transform',
          },
        })
      }
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
