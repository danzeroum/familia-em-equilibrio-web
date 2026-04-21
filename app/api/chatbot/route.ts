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

  // Parse usando modelo da VPS
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
}
