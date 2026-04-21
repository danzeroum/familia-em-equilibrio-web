// app/api/chatbot/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseUserInput } from '@/lib/chatbot-parser'
import { insertParsedItems } from '@/lib/chatbot-inserter'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, familyId, createdBy, autoInsert } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Texto não pode ser vazio' }, { status: 400 })
    }
    if (!familyId) {
      return NextResponse.json({ error: 'familyId é obrigatório' }, { status: 400 })
    }

    // 1. Parsear com GPT-4o
    const parseResult = await parseUserInput(text)

    // 2. Apenas preview — retorna sem inserir
    if (!autoInsert) {
      return NextResponse.json({
        preview: parseResult.items,
        rawText: text,
        parsedAt: parseResult.parsedAt,
      })
    }

    // 3. Inserir no banco
    const insertResult = await insertParsedItems(
      parseResult.items,
      familyId,
      createdBy
    )

    return NextResponse.json({
      items: parseResult.items,
      insertResult,
      parsedAt: parseResult.parsedAt,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[chatbot/route]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
