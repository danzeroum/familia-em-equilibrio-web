// lib/chatbot-query.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLLMClient, DEFAULT_MODEL, LLMModelId } from '@/lib/llm-client'

// ─── Detecção de intenção ────────────────────────────────────────────────────

const QUESTION_PATTERNS = [
  /\bquant(as?|os?|idade)\b/i,
  /\bquais?\b/i,
  /\bqual\b/i,
  /\bquando\b/i,
  /\bonde\b/i,
  /\bquem\b/i,
  /\bpor que\b/i,
  /\bcomo (está|estão|anda|ficou)\b/i,
  /\b(me (diga|fala|mostra|lista|conta|diz))\b/i,
  /\b(lista[rm]?|mostre?|verifique?|cheque?|confira?)\b/i,
  /\b(tem |há |existe[m]?|possui)\b/i,
  /\b(está[o]?|ficou|ficaram)\b/i,
  /\?$/,
  /^(o que|qual|quais|quando|onde|quem|como|por que|quanto)/i,
  /\b(próxim[ao]s?|previsão|venc[ei]|atrasad[ao]s?|pendente[s]?)\b/i,
  /\b(resumo|balanço|situação|status|overview)\b/i,
  /\b(hoje|essa semana|este mês|semana que vem)\b/i,
]

export function isQuestion(text: string): boolean {
  return QUESTION_PATTERNS.some(p => p.test(text))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Retorna IDs dos membros da família para usar em tabelas sem family_id direto */
async function getMemberIds(familyId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('family_id', familyId)
  return (data ?? []).map(m => m.id)
}

/** Fallback seguro para .in() — evita erro com array vazio */
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'
function safeIds(ids: string[]): string[] {
  return ids.length > 0 ? ids : [EMPTY_UUID]
}

// ─── Mapeamento texto → tabelas ──────────────────────────────────────────────

interface ContextFetcher {
  pattern: RegExp
  fetch: (familyId: string) => Promise<{ label: string; data: any[] }>
}

const CONTEXT_FETCHERS: ContextFetcher[] = [
  // COMPRAS — lista geral
  {
    pattern: /\b(compr[ao]s?|mercado|lista|mantimento|falt[ao]|precis[ao]|itens?|pedir|carrinho|supermercado|feira|comprinhas)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('shopping_items')
        .select('name, quantity, category, status, is_bought, notes')
        .eq('family_id', fid)
        .eq('is_bought', false)
        .order('created_at', { ascending: false })
      return { label: 'Lista de compras (itens pendentes)', data: data ?? [] }
    },
  },

  // COMPRAS — alimentos
  {
    pattern: /\b(aliment[oa]s?|frutas?|verdura[s]?|legume[s]?|carne[s]?|laticíni[oa]s?|bebida[s]?|mercearia|hortifruti|padaria)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('shopping_items')
        .select('name, quantity, category, is_bought')
        .eq('family_id', fid)
        .eq('category', 'grocery')
        .eq('is_bought', false)
      return { label: 'Itens de mercado/alimentos pendentes', data: data ?? [] }
    },
  },

  // COMPRAS — farmácia
  {
    pattern: /\b(farmácia|fralda[s]?|higiene|lenço[s]?|cotonete[s]?|absorvente[s]?|curativ[oa]s?)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('shopping_items')
        .select('name, quantity, category, is_bought')
        .eq('family_id', fid)
        .eq('category', 'pharmacy')
        .eq('is_bought', false)
      return { label: 'Itens de farmácia/higiene pendentes', data: data ?? [] }
    },
  },

  // TAREFAS — tasks não tem family_id, acessa via profiles
  {
    pattern: /\b(tarefa[s]?|afazere[s]?|pendência[s]?|to.?do|fazer|incumbência[s]?|dever[s]?|obrigaç[aã]o|atividade[s]?)\b/i,
    fetch: async (fid) => {
      const memberIds = await getMemberIds(fid)
      const { data } = await supabaseAdmin
        .from('tasks')
        .select('title, status, due_date, due_time, assigned_to, priority, notes')
        .in('assigned_to', safeIds(memberIds))
        .neq('status', 'done')
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(30)
      return { label: 'Tarefas pendentes', data: data ?? [] }
    },
  },

  // MANUTENÇÃO DA CASA — home_maintenance tem family_id ✅
  {
    pattern: /\b(manutenç[aã]o|rotina|conservaç[aã]o|limpeza peri[oó]dic|vistoria|inspeç[aã]o|revisão da casa|manutenções)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('home_maintenance')
        .select('title, status, next_due_at, frequency_label, category, notes')
        .eq('family_id', fid)
        .order('next_due_at', { ascending: true, nullsFirst: false })
      return { label: 'Manutenções da casa', data: data ?? [] }
    },
  },

  // CHAMADOS / REPAROS — maintenance_calls tem family_id ✅
  {
    pattern: /\b(chamado[s]?|reparo[s]?|conserto[s]?|quebrad[oa]s?|urgente[s]?|serviço[s]?|profissional|encanador|eletricista|pedreiro|técnico)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('maintenance_calls')
        .select('title, status, priority, scheduled_date, professional_name, estimated_cost, description')
        .eq('family_id', fid)
        .neq('status', 'done')
        .order('priority', { ascending: false })
      return { label: 'Chamados de manutenção abertos', data: data ?? [] }
    },
  },

  // CARRO / VEÍCULO
  {
    pattern: /\b(carro[s]?|veículo[s]?|óleo|pneu[s]?|moto|combustível|mecânico|borracharia|ipva|licenciamento|seguro do carro)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('maintenance_calls')
        .select('title, status, scheduled_date, notes, description, estimated_cost')
        .eq('family_id', fid)
        .ilike('title', '%carro%')
        .order('scheduled_date', { ascending: true, nullsFirst: false })
      return { label: 'Manutenções do carro/veículo', data: data ?? [] }
    },
  },

  // CONTAS / FINANCEIRO — bills tem family_id ✅, coluna é "title" (não "name"), sem "recurrence" → usa "is_recurring"
  {
    pattern: /\b(conta[s]?|financeiro|despesa[s]?|fatura[s]?|pagament[oa]s?|gasto[s]?|boleto[s]?|parcela[s]?|venciment[oa]s?|divida[s]?|mensalidade[s]?|aluguel|luz|água|internet|telefone|streaming|plano)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('bills')
        .select('title, amount, due_day, due_date, status, category, is_recurring, payment_method')
        .eq('family_id', fid)
        .order('due_day', { ascending: true, nullsFirst: false })
      return { label: 'Contas e despesas', data: data ?? [] }
    },
  },

  // REMÉDIOS / MEDICAMENTOS — medications não tem family_id, acessa via profile_id
  {
    pattern: /\b(remédio[s]?|medicament[oa]s?|medicaç[aã]o|estoque|comprimido[s]?|cápsula[s]?|xarope[s]?|pomada[s]?|dose[s]?|posologia|receita)\b/i,
    fetch: async (fid) => {
      const memberIds = await getMemberIds(fid)
      const { data } = await supabaseAdmin
        .from('medications')
        .select('name, dosage, form, is_active, stock_quantity, minimum_stock, expiry_date, notes')
        .in('profile_id', safeIds(memberIds))
        .eq('is_active', true)
        .order('name')
      return { label: 'Medicamentos ativos', data: data ?? [] }
    },
  },

  // VACINAS — vaccines não tem family_id, acessa via profile_id
  {
    pattern: /\b(vacina[s]?|imunizaç[aã]o|dose[s]? da vacina|carteira de vacina|reforço|vacinação)\b/i,
    fetch: async (fid) => {
      const memberIds = await getMemberIds(fid)
      const { data } = await supabaseAdmin
        .from('vaccines')
        .select('name, applied_at, next_due, notes')
        .in('profile_id', safeIds(memberIds))
        .order('next_due', { ascending: true, nullsFirst: false })
      return { label: 'Vacinas', data: data ?? [] }
    },
  },

  // EVENTOS / AGENDA — family_events tem family_id ✅
  {
    pattern: /\b(evento[s]?|agenda|compromiss[oa]s?|aniversári[oa]s?|consulta[s]?|reunião|reuniões|appointment|birthday|próxim[oa]s? eventos?|calendário|programação)\b/i,
    fetch: async (fid) => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabaseAdmin
        .from('family_events')
        .select('title, event_date, event_time, event_type, location, description, is_done, notes')
        .eq('family_id', fid)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(20)
      return { label: 'Próximos eventos na agenda', data: data ?? [] }
    },
  },

  // SAÚDE — health_tracking tem family_id ✅, colunas reais: title, category, status, next_due_at, frequency_label, profile_id
  {
    pattern: /\b(saúde|médico[s]?|exame[s]?|resultado[s]?|peso|pressão|glicemia|acompanhament[oa] de saúde)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('health_tracking')
        .select('title, category, status, next_due_at, frequency_label, profile_id, notes')
        .eq('family_id', fid)
        .order('next_due_at', { ascending: true, nullsFirst: false })
        .limit(20)
      return { label: 'Acompanhamentos de saúde', data: data ?? [] }
    },
  },
]

// ─── Busca de contexto relevante ─────────────────────────────────────────────

async function fetchContext(question: string, familyId: string) {
  const matched: { label: string; data: any[] }[] = []

  for (const fetcher of CONTEXT_FETCHERS) {
    if (fetcher.pattern.test(question)) {
      try {
        const result = await fetcher.fetch(familyId)
        if (result.data.length > 0 || matched.length === 0) {
          matched.push(result)
        }
      } catch (err: any) {
        console.error(`[chatbot-query] erro ao buscar contexto:`, err?.message)
      }
    }
  }

  // Resumo geral — nenhum padrão bateu
  if (matched.length === 0) {
    const memberIds = await getMemberIds(familyId)
    const [shopping, tasks, bills] = await Promise.all([
      supabaseAdmin
        .from('shopping_items')
        .select('name, is_bought')
        .eq('family_id', familyId)
        .eq('is_bought', false),
      supabaseAdmin
        .from('tasks')
        .select('title, status')
        .in('assigned_to', safeIds(memberIds))
        .neq('status', 'done'),
      supabaseAdmin
        .from('bills')
        .select('title, amount, status')
        .eq('family_id', familyId),
    ])
    matched.push({
      label: 'Resumo geral',
      data: [
        { compras_pendentes: (shopping.data ?? []).length },
        { tarefas_pendentes: (tasks.data ?? []).length },
        { contas_cadastradas: (bills.data ?? []).length },
      ],
    })
  }

  return matched
}

// ─── Resposta via LLM ────────────────────────────────────────────────────────

export async function answerQuestion(
  question: string,
  familyId: string,
  modelId?: LLMModelId
): Promise<string> {
  const context = await fetchContext(question, familyId)
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const contextText = context
    .map(c => `### ${c.label}\n${JSON.stringify(c.data, null, 2)}`)
    .join('\n\n')

  const systemPrompt = `Você é um assistente doméstico familiar inteligente e simpático.
Hoje é ${today}.
Responda perguntas sobre a organização da família de forma direta, clara e amigável em português brasileiro.
Use emojis quando apropriado. Seja conciso mas completo.
Quando listar itens, use bullets ou numeração.
Se os dados estiverem vazios, diga que não há registros e sugira adicionar.`

  const userPrompt = `Com base nos dados abaixo, responda a pergunta do usuário.

${contextText}

Pergunta: ${question}`

  try {
    const client = createLLMClient(modelId)
    const model = modelId ?? DEFAULT_MODEL

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    })

    return response.choices[0].message.content ?? 'Não consegui gerar uma resposta.'
  } catch (err: any) {
    console.error('[chatbot-query] erro LLM:', err?.message)
    return formatFallbackAnswer(question, context)
  }
}

// ─── Fallback sem LLM ────────────────────────────────────────────────────────

function formatFallbackAnswer(question: string, context: { label: string; data: any[] }[]): string {
  if (context.length === 0) return 'Não encontrei dados relacionados à sua pergunta.'

  const lines: string[] = []
  for (const ctx of context) {
    lines.push(`**${ctx.label}** (${ctx.data.length} registros)`)
    ctx.data.slice(0, 10).forEach((item: any) => {
      const name = item.name ?? item.title ?? item.summary ?? JSON.stringify(item)
      lines.push(`• ${name}`)
    })
    if (ctx.data.length > 10) lines.push(`  _...e mais ${ctx.data.length - 10} itens_`)
  }

  return lines.join('\n')
}
