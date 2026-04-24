// lib/chatbot-query.ts
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createLLMClient, DEFAULT_MODEL, LLMModelId } from '@/lib/llm-client'

const INSERT_PATTERNS = [
  /\b(insir[ae]|adiciona[r]?|cadastra[r]?|salva[r]?|registra[r]?|coloca[r]?)\b/i,
  /\b(comprar|compra[s]?)\b/i,
  /^\s*[-•*\d]/m,
]

export function isInsertIntent(text: string): boolean {
  return INSERT_PATTERNS.some(p => p.test(text))
}

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
  /\b(mostre?|verifique?|cheque?|confira?)\b/i,
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

async function getMemberIds(familyId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('family_id', familyId)
  return (data ?? []).map(m => m.id)
}

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'
function safeIds(ids: string[]): string[] {
  return ids.length > 0 ? ids : [EMPTY_UUID]
}

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

  // DESPENSA / ESTOQUE
  {
    pattern: /\b(despensa|estoque|armário|geladeira|pantry|ingrediente[s]?|faltando em casa)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('pantry_items')
        .select('name, quantity, unit, category, expiry_date, minimum_quantity, notes')
        .eq('family_id', fid)
        .order('name')
      return { label: 'Despensa / estoque de casa', data: data ?? [] }
    },
  },

  // RECEITAS
  {
    pattern: /\b(receita[s]?|prato[s]?|comida|cardápio|cozinha|ingrediente[s]? da receita)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('recipes')
        .select('name, category, prep_time, servings, notes')
        .eq('family_id', fid)
        .order('name')
      return { label: 'Receitas cadastradas', data: data ?? [] }
    },
  },

  // PLANO ALIMENTAR
  {
    pattern: /\b(plano alimentar|refeição|refeições|almoço|jantar|café da manhã|lanche|dieta|cardápio semanal)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('meal_plan')
        .select('*')
        .eq('family_id', fid)
        .order('created_at', { ascending: false })
        .limit(10)
      return { label: 'Plano alimentar', data: data ?? [] }
    },
  },

  // TAREFAS
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

  // ESCOLA — lição de casa
  {
    pattern: /\b(lição|dever de casa|homework|escol[a]?|matéria|prova[s]?|trabalho escolar|boletim)\b/i,
    fetch: async (fid) => {
      const memberIds = await getMemberIds(fid)
      const [hw, shw] = await Promise.all([
        supabaseAdmin
          .from('homework')
          .select('title, subject, due_date, status, notes')
          .in('profile_id', safeIds(memberIds))
          .order('due_date', { ascending: true }),
        supabaseAdmin
          .from('school_homework')
          .select('title, subject, due_date, status, notes')
          .eq('family_id', fid)
          .order('due_date', { ascending: true }),
      ])
      return { label: 'Lições e tarefas escolares', data: [...(hw.data ?? []), ...(shw.data ?? [])] }
    },
  },

  // ESCOLA — materiais e comunicados
  {
    pattern: /\b(material escolar|mochila|caderno[s]?|lápis|uniforme|comunicado|recado da escola|lista de material)\b/i,
    fetch: async (fid) => {
      const [supplies, comms] = await Promise.all([
        supabaseAdmin
          .from('school_supplies')
          .select('name, quantity, is_bought, notes')
          .eq('family_id', fid),
        supabaseAdmin
          .from('school_communications')
          .select('title, content, received_at, is_read')
          .eq('family_id', fid)
          .order('received_at', { ascending: false })
          .limit(10),
      ])
      return {
        label: 'Materiais e comunicados escolares',
        data: [...(supplies.data ?? []), ...(comms.data ?? [])],
      }
    },
  },

  // VEÍCULOS — tabela dedicada vehicle_maintenance + vehicles
  {
    pattern: /\b(carro[s]?|veículo[s]?|óleo|pneu[s]?|moto|combustível|mecânico|borracharia|ipva|licenciamento|seguro do carro|revisão|quilometragem|km|versa|frota|documento[s]? do carro)\b/i,
    fetch: async (fid) => {
      const [vehicles, maintenance, docs, calls] = await Promise.all([
        supabaseAdmin
          .from('vehicles')
          .select('name, brand, model, year, plate, color, notes')
          .eq('family_id', fid),
        supabaseAdmin
          .from('vehicle_maintenance')
          .select('title, status, next_due_at, last_done_at, frequency_label, next_due_km, notes')
          .eq('family_id', fid)
          .order('next_due_at', { ascending: true, nullsFirst: false }),
        supabaseAdmin
          .from('vehicle_documents')
          .select('title, expiry_date, status, notes')
          .eq('family_id', fid)
          .order('expiry_date', { ascending: true }),
        supabaseAdmin
          .from('vehicle_calls')
          .select('title, status, scheduled_date, estimated_cost, notes')
          .eq('family_id', fid)
          .neq('status', 'done'),
      ])
      return {
        label: 'Veículos — manutenção, documentos e chamados',
        data: {
          veiculos: vehicles.data ?? [],
          manutencoes: maintenance.data ?? [],
          documentos: docs.data ?? [],
          chamados: calls.data ?? [],
        } as any,
      }
    },
  },

  // MANUTENÇÃO DA CASA
  {
    pattern: /\b(manutenç[aã]o da casa|rotina da casa|conservaç[aã]o|limpeza peri[oó]dic|vistoria|inspeç[aã]o|manutenções)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('home_maintenance')
        .select('title, status, next_due_at, frequency_label, category, notes')
        .eq('family_id', fid)
        .order('next_due_at', { ascending: true, nullsFirst: false })
      return { label: 'Manutenções da casa', data: data ?? [] }
    },
  },

  // CHAMADOS / REPAROS
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

  // CONTAS / FINANCEIRO
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

  // METAS DE ECONOMIA / ORÇAMENTO
  {
    pattern: /\b(meta[s]? de economia|poupança|economizar|reserva|orçamento|budget|meta financeira|objetivo financeiro)\b/i,
    fetch: async (fid) => {
      const [savings, budget] = await Promise.all([
        supabaseAdmin
          .from('savings_goals')
          .select('title, target_amount, current_amount, deadline, status, notes')
          .eq('family_id', fid),
        supabaseAdmin
          .from('budget_goals')
          .select('category, limit_amount, spent_amount, period, notes')
          .eq('family_id', fid),
      ])
      return {
        label: 'Metas financeiras e orçamento',
        data: { metas: savings.data ?? [], orcamento: budget.data ?? [] } as any,
      }
    },
  },

  // REMÉDIOS / MEDICAMENTOS
  {
    pattern: /\b(remédio[s]?|medicament[oa]s?|medicaç[aã]o|estoque|comprimido[s]?|cápsula[s]?|xarope[s]?|pomada[s]?|dose[s]?|posologia|receita médica)\b/i,
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

  // VACINAS
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

  // SAÚDE — rastreamento
  {
    pattern: /\b(saúde|médico[s]?|exame[s]?|resultado[s]?|peso|pressão|glicemia|acompanhament[oa] de saúde|protocolo de saúde)\b/i,
    fetch: async (fid) => {
      const [tracking, protocols] = await Promise.all([
        supabaseAdmin
          .from('health_tracking')
          .select('title, category, status, next_due_at, frequency_label, profile_id, notes')
          .eq('family_id', fid)
          .order('next_due_at', { ascending: true, nullsFirst: false })
          .limit(20),
        supabaseAdmin
          .from('health_protocols')
          .select('title, trigger_condition, action_text, priority, is_active')
          .in('profile_id', safeIds(memberIds))
          .eq('is_active', true)
          .limit(10),
      ])
      return {
        label: 'Acompanhamentos e protocolos de saúde',
        data: [...(tracking.data ?? []), ...(protocols.data ?? [])],
      }
    },
  },

  // EVENTOS / AGENDA
  {
    pattern: /\b(evento[s]?|agenda|compromiss[oa]s?|aniversári[oa]s?|consulta[s]?|reunião|reuniões|próxim[oa]s? eventos?|calendário|programação|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|janeiro|fevereiro|março|abril)\b/i,
    fetch: async (fid) => {
      const today = new Date().toISOString().split('T')[0]
      const { data } = await supabaseAdmin
        .from('family_events')
        .select('title, event_date, event_time, event_type, location, description, is_done, notes')
        .eq('family_id', fid)
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(30)
      return { label: 'Próximos eventos na agenda', data: data ?? [] }
    },
  },

  // EVENTOS SOCIAIS (festas, churrascos, comemorações)
  {
    pattern: /\b(festa[s]?|churrasco[s]?|comemoração|celebração|convidado[s]?|evento social|aniversário de)\b/i,
    fetch: async (fid) => {
      const [events, tasks, shopping, expenses] = await Promise.all([
        supabaseAdmin
          .from('social_events')
          .select('title, event_date, location, status, notes')
          .eq('family_id', fid)
          .order('event_date', { ascending: true }),
        supabaseAdmin
          .from('social_event_tasks')
          .select('title, status, assigned_to, due_date')
          .eq('family_id', fid),
        supabaseAdmin
          .from('social_event_shopping')
          .select('name, quantity, is_bought, estimated_cost')
          .eq('family_id', fid),
        supabaseAdmin
          .from('social_event_expenses')
          .select('title, amount, category, notes')
          .eq('family_id', fid),
      ])
      return {
        label: 'Eventos sociais (festas, celebrações)',
        data: {
          eventos: events.data ?? [],
          tarefas: tasks.data ?? [],
          compras: shopping.data ?? [],
          despesas: expenses.data ?? [],
        } as any,
      }
    },
  },

  // GUARDA-ROUPA
  {
    pattern: /\b(roupa[s]?|guarda.?roupa|vestuário|armário de roupa|peça[s]? de roupa|uniforme[s]?|calçado[s]?|tênis|sapato[s]?)\b/i,
    fetch: async (fid) => {
      const memberIds = await getMemberIds(fid)
      const { data } = await supabaseAdmin
        .from('wardrobe_items')
        .select('name, category, color, size, season, notes')
        .in('profile_id', safeIds(memberIds))
        .order('name')
      return { label: 'Guarda-roupa', data: data ?? [] }
    },
  },

  // CONTATOS DE EMERGÊNCIA
  {
    pattern: /\b(emergência|contato[s]? de emergência|socorro|urgência|bombeiro|samu|polícia|vizinho[s]?|prestador[s]?)\b/i,
    fetch: async (fid) => {
      const { data } = await supabaseAdmin
        .from('emergency_contacts')
        .select('name, phone, relationship, notes')
        .eq('family_id', fid)
        .order('name')
      return { label: 'Contatos de emergência', data: data ?? [] }
    },
  },

  // CHECKINS EMOCIONAIS
  {
    pattern: /\b(emocional|humor|sentimento[s]?|checkin|bem.?estar|ansiedade|estresse|feliz|triste|cansado)\b/i,
    fetch: async (fid) => {
      const memberIds = await getMemberIds(fid)
      const { data } = await supabaseAdmin
        .from('emotional_checkins')
        .select('mood, notes, created_at, profile_id')
        .in('profile_id', safeIds(memberIds))
        .order('created_at', { ascending: false })
        .limit(10)
      return { label: 'Últimos check-ins emocionais', data: data ?? [] }
    },
  },

  // GRATIDÃO
  {
    pattern: /\b(gratidão|grato|agradecer|nota[s]? de gratidão|diário)\b/i,
    fetch: async (fid) => {
      const memberIds = await getMemberIds(fid)
      const { data } = await supabaseAdmin
        .from('gratitude_notes')
        .select('content, created_at, profile_id')
        .in('profile_id', safeIds(memberIds))
        .order('created_at', { ascending: false })
        .limit(10)
      return { label: 'Notas de gratidão', data: data ?? [] }
    },
  },
]

async function fetchContext(question: string, familyId: string) {
  const matched: { label: string; data: any[] }[] = []

  for (const fetcher of CONTEXT_FETCHERS) {
    if (fetcher.pattern.test(question)) {
      try {
        const result = await fetcher.fetch(familyId)
        matched.push(result)
      } catch (err: any) {
        console.error(`[chatbot-query] erro ao buscar contexto:`, err?.message)
      }
    }
  }

  // Resumo geral — nenhum padrão bateu
  if (matched.length === 0) {
    const memberIds = await getMemberIds(familyId)
    const [shopping, tasks, bills, events, vehicles] = await Promise.all([
      supabaseAdmin.from('shopping_items').select('name, is_bought').eq('family_id', familyId).eq('is_bought', false),
      supabaseAdmin.from('tasks').select('title, status').in('assigned_to', safeIds(memberIds)).neq('status', 'done'),
      supabaseAdmin.from('bills').select('title, amount, status').eq('family_id', familyId),
      supabaseAdmin.from('family_events').select('title, event_date').eq('family_id', familyId).gte('event_date', new Date().toISOString().split('T')[0]).limit(5),
      supabaseAdmin.from('vehicle_maintenance').select('title, status, next_due_at').eq('family_id', familyId).limit(5),
    ])
    matched.push({
      label: 'Resumo geral da família',
      data: [
        { compras_pendentes: (shopping.data ?? []).length },
        { tarefas_pendentes: (tasks.data ?? []).length },
        { contas_cadastradas: (bills.data ?? []).length },
        { proximos_eventos: events.data ?? [] },
        { manutencoes_veiculo: vehicles.data ?? [] },
      ],
    })
  }

  return matched
}

export async function answerQuestion(
  question: string,
  familyId: string,
  modelId?: LLMModelId,
  customSystemPrompt?: string
): Promise<string> {
  const context = await fetchContext(question, familyId)
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const contextText = context
    .map(c => `### ${c.label}\n${JSON.stringify(c.data, null, 2)}`)
    .join('\n\n')

  const basePrompt = customSystemPrompt ?? `Você é um assistente doméstico familiar inteligente e simpático.
Responda perguntas sobre a organização da família de forma direta, clara e amigável em português brasileiro.
Use emojis quando apropriado. Seja conciso mas completo.
Quando listar itens, use bullets ou numeração.
Se os dados estiverem vazios, diga que não há registros e sugira adicionar.`

  const systemPrompt = `${basePrompt}\n\nHoje é ${today}.`
  const userPrompt = `Com base nos dados abaixo, responda a pergunta do usuário.\n\n${contextText}\n\nPergunta: ${question}`

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
