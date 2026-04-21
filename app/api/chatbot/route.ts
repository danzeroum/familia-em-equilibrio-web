import { NextRequest, NextResponse } from 'next/server';
import { parseUserInput } from '@/lib/chatbot-parser';
import { insertParsedItems } from '@/lib/chatbot-inserter';

export async function POST(req: NextRequest) {
  const { text, familyId, createdBy, autoInsert } = await req.json();

  if (!text || !familyId || !createdBy) {
    return NextResponse.json(
      { error: 'text, familyId e createdBy são obrigatórios' },
      { status: 400 }
    );
  }

  const parseResult = await parseUserInput(text);

  if (!autoInsert) {
    // Retorna preview para confirmação no UI
    return NextResponse.json({ preview: parseResult.items });
  }

  const insertResult = await insertParsedItems(
    parseResult.items,
    familyId,
    createdBy
  );

  return NextResponse.json({ ...parseResult, insertResult });
}
