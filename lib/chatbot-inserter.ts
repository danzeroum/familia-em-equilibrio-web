// lib/chatbot-inserter.ts
import { supabase } from '@/lib/supabase'  // ← usa o import direto, sem createClient()
import { ParsedItem } from '@/types/chatbot'

function recurrenceToDays(r?: string | null, interval?: number | null): number {
  const i = interval ?? 1
  if (r === 'daily')   return i
  if (r === 'weekly')  return i * 7
  if (r === 'monthly') return i * 30
  if (r === 'yearly')  return i * 365
  return 365
}

export async function insertParsedItems(
  items: ParsedItem[],
  familyId: string,
  createdBy: string
) {
  const results = { inserted: 0, failed: 0, errors: [] as string[] }

  for (const item of items) {
    try {
      switch (item.type) {

        // ── SHOPPING ────────────────────────────────────────────────────
        case 'shopping': {
          const { error } = await supabase.from('shopping_items').insert({
            family_id: familyId,
            name: item.title,
            quantity: item.quantity ?? '1',
            category: item.category ?? 'Geral',
            status: 'needed',
            is_bought: false,
            is_recurring: false,
            requested_by: createdBy,
          })
          if (error) throw error
          break
        }

        // ── TASK ─────────────────────────────────────────────────────────
        case 'task': {
          let recurrence_id: string | null = null

          if (item.recurrence) {
            const { data: rr, error: rrErr } = await supabase
              .from('recurrence_rules')
              .insert({
                frequency: item.recurrence,          // 'daily'|'weekly'|'monthly'|'yearly'
                interval: item.recurrence_interval ?? 1,
                next_occurrence: new Date().toISOString().split('T')[0],
              })
              .select('id')
              .single()
            if (rrErr) throw rrErr
            recurrence_id = rr?.id ?? null
          }

          const { error } = await supabase.from('tasks').insert({
            title: item.title,
            status: 'pending',
            created_by: createdBy,
            recurrence_id,
            notes: item.notes ?? null,
            priority: 2,
          })
          if (error) throw error
          break
        }

        // ── HOME MAINTENANCE (rotinas periódicas) ────────────────────────
        case 'home_maintenance': {
          const { error } = await supabase.from('home_maintenance').insert({
            family_id: familyId,
            title: item.title,
            emoji: '🔧',
            frequency_label: item.recurrence
              ? `A cada ${item.recurrence_interval ?? 1} ${{
                  daily: 'dia(s)', weekly: 'semana(s)',
                  monthly: 'mês(es)', yearly: 'ano(s)',
                }[item.recurrence] ?? 'período(s)'}`
              : 'Pontual',
            frequency_days: recurrenceToDays(item.recurrence, item.recurrence_interval),
            category: item.location?.toLowerCase() ?? 'geral',
            status: 'ok',
            notes: item.notes ?? null,
            created_by: createdBy,
            responsible_id: createdBy,
          })
          if (error) throw error
          break
        }

        // ── MAINTENANCE CALL (reparos pontuais) ──────────────────────────
        // ⚠️ maintenance_calls NÃO tem family_id — RLS via created_by
        case 'maintenance_call': {
          const { error } = await supabase.from('maintenance_calls').insert({
            title: item.title,
            description: item.location ? `Local: ${item.location}` : null,
            status: 'open',            // ← default do banco é 'open', não 'pending'
            priority: 2,
            created_by: createdBy,
          })
          if (error) throw error
          break
        }

        // ── FAMILY EVENT ─────────────────────────────────────────────────
        case 'family_event': {
          const { error } = await supabase.from('family_events').insert({
            family_id: familyId,
            title: item.title,
            event_date: item.date ?? new Date().toISOString().split('T')[0],
            event_time: item.time ?? null,
            event_type: 'general',
            created_by: createdBy,
            description: item.notes ?? null,  // ← era 'notes', coluna correta é 'description'
            needs_action: false,
            is_done: false,
          })
          if (error) throw error
          break
        }

        // ── MEDICATION ───────────────────────────────────────────────────
        case 'medication': {
          const { error } = await supabase.from('medications').insert({
            profile_id: createdBy,
            name: item.title,
            dosage: item.notes ?? null,
            form: 'other',
            is_active: true,
            item_condition: 'ok',
            stock_quantity: item.quantity ? (parseInt(item.quantity) || 1) : 1,
            minimum_stock: 1,
            weight_based: false,
            dosage_interval_hours: 6,
            max_doses_per_day: 4,
          })
          if (error) throw error
          break
        }

        // ── VACCINE ──────────────────────────────────────────────────────
        case 'vaccine': {
          const { error } = await supabase.from('vaccines').insert({
            profile_id: createdBy,
            name: item.title,
            notes: item.notes ?? null,
          })
          if (error) throw error
          break
        }
      }

      results.inserted++
    } catch (err: any) {
      results.failed++
      results.errors.push(`[${item.type}] ${item.title}: ${err.message}`)
    }
  }

  return results
}
