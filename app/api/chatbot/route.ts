import { NextRequest, NextResponse } from 'next/server'
import { parseUserInput } from '@/lib/chatbot-parser'
import { insertParsedItems } from '@/lib/chatbot-inserter'
import type { LLMModelId } from '@/lib/llm-client'

export async function POST(req: NextRequest) {
  const { text, familyId, memberId, autoInsert, modelId } = await req.json()

  if (!text || !familyId) {
    return NextResponse.json({ error: 'text e familyId obrigatórios' }, { status: 400 })
  }

  // modelId vem do front — se não informado, usa LLM_DEFAULT_MODEL do .env
  const parseResult = await parseUserInput(text, modelId as LLMModelId | undefined)

  if (!autoInsert) {
    return NextResponse.json({
      preview: parseResult.items,
      rawText: text,
      modelUsed: parseResult.modelUsed,  // retorna qual modelo foi usado
    })
  }

  const insertResult = await insertParsedItems(parseResult.items, familyId, memberId)
  return NextResponse.json({ ...parseResult, insertResult })
}
