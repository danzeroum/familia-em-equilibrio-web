'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { daysUntil, getPriority } from '@/lib/utils'
import type { FamilyEvent } from '@/types/database'

export interface RadarItem {
  id: string
  category: string
  title: string
  action: string
  eventDate: string | null
  daysLeft: number | null
  priority: 'urgent' | 'attention' | 'planned' | 'overdue'
  status: string
  source: 'event' | 'bill' | 'vaccine' | 'medication' | 'task'
  sourceId: string
}

export function useRadarItems(familyId: string | null) {
  const [items, setItems] = useState<RadarItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [counts, setCounts] = useState({ urgent: 0, attention: 0, planned: 0, done: 0 })

  useEffect(() => {
    if (!familyId) { setIsLoading(false); return }
    load()
  }, [familyId])

  async function load() {
    if (!familyId) return
    setIsLoading(true)
    const radar: RadarItem[] = []
    const today = new Date().toISOString().split('T')[0]
    const in90days = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

    // 1. Eventos familiares nos próximos 90 dias
    const { data: events } = await supabase
      .from('family_events')
      .select('*')
      .eq('family_id', familyId)
      .gte('event_date', today)
      .lte('event_date', in90days)
      .order('event_date', { ascending: true })

    events?.forEach((e) => {
      const days = daysUntil(e.event_date)
      radar.push({
        id: e.id,
        category: eventTypeLabel(e.event_type),
        title: e.title,
        action: e.action_description ?? '—',
        eventDate: e.event_date,
        daysLeft: days,
        priority: getPriority(days),
        status: e.is_done ? '✅ Feito' : '⏳ Pendente',
        source: 'event',
        sourceId: e.id,
      })
    })

    // 2. Contas em atraso ou vencendo em 7 dias
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .in('status', ['pending', 'overdue'])

    bills?.forEach((b) => {
      if (!b.due_date) return
      const days = daysUntil(b.due_date)
      if (days !== null && days > 30) return
      radar.push({
        id: b.id,
        category: '💳 Conta',
        title: b.title,
        action: `Vence dia ${b.due_day ?? '—'}`,
        eventDate: b.due_date,
        daysLeft: days,
        priority: getPriority(days),
        status: statusLabel(b.status),
        source: 'bill',
        sourceId: b.id,
      })
    })

    // 3. Vacinas com próxima dose nos próximos 90 dias
    const { data: vaccines } = await supabase
      .from('vaccines')
      .select('*, profiles(name, nickname)')
      .not('next_due', 'is', null)
      .lte('next_due', in90days)

    vaccines?.forEach((v: any) => {
      const days = daysUntil(v.next_due)
      const memberName = v.profiles?.nickname ?? v.profiles?.name ?? ''
      radar.push({
        id: v.id,
        category: '💉 Vacina',
        title: `${v.name}${memberName ? ` — ${memberName}` : ''}`,
        action: 'Agendar no posto de saúde',
        eventDate: v.next_due,
        daysLeft: days,
        priority: getPriority(days),
        status: '⏳ Pendente',
        source: 'vaccine',
        sourceId: v.id,
      })
    })

    // 4. Medicamentos vencendo ou com estoque baixo
    const { data: meds } = await supabase
      .from('medications')
      .select('*, profiles(name, nickname)')
      .eq('is_active', true)

    meds?.forEach((m: any) => {
      const days = m.expiry_date ? daysUntil(m.expiry_date) : null
      const lowStock = m.stock_quantity <= m.minimum_stock
      const expiring = days !== null && days <= 30
      if (!lowStock && !expiring) return
      const memberName = m.profiles?.nickname ?? m.profiles?.name ?? ''
      radar.push({
        id: m.id,
        category: '💊 Remédio',
        title: `${m.name}${memberName ? ` — ${memberName}` : ''}`,
        action: lowStock ? 'Repor estoque na farmácia' : 'Verificar validade',
        eventDate: m.expiry_date,
        daysLeft: days,
        priority: days !== null && days < 0 ? 'overdue' : expiring ? 'attention' : 'attention',
        status: lowStock ? '⚠️ Repor' : '🟡 Vence em breve',
        source: 'medication',
        sourceId: m.id,
      })
    })

    // Ordena: overdue > urgent > attention > planned
    const order = { overdue: 0, urgent: 1, attention: 2, planned: 3 }
    radar.sort((a, b) => order[a.priority] - order[b.priority])

    setItems(radar)
    setCounts({
      urgent: radar.filter((r) => r.priority === 'urgent' || r.priority === 'overdue').length,
      attention: radar.filter((r) => r.priority === 'attention').length,
      planned: radar.filter((r) => r.priority === 'planned').length,
      done: radar.filter((r) => r.status.includes('Feito')).length,
    })
    setIsLoading(false)
  }

  return { items, counts, isLoading, reload: load }
}

function eventTypeLabel(type: string | null) {
  const map: Record<string, string> = {
    birthday: '🎂 Aniversário',
    school: '🎒 Escola',
    medical: '🏥 Médico',
    travel: '✈️ Viagem',
    general: '📅 Evento',
  }
  return map[type ?? 'general'] ?? '📅 Evento'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '⏳ Pendente',
    paid: '✅ Pago',
    auto_debit: '🔄 Débito auto',
    overdue: '🔴 Atrasado',
  }
  return map[status] ?? status
}
