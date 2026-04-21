import { supabase } from '@/lib/supabase'
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

        case 'shopping': {
          const { error } = await supabase.from('shopping_items').insert({
            family_id: familyId,
            name: item.title,
            quantity: item.quantity ?? null,
            category: item.category ?? null,
            status: 'needed',
            is_bought: false,
            is_recurring: false,
            requested_by: createdBy,
          } as any)
          if (error) throw new Error(error.message)
          break
        }

        case 'task': {
          const recurrenceNote = item.recurrence
            ? `[Recorrência: ${item.recurrence}${item.recurrence_interval ? ` a cada ${item.recurrence_interval}` : ''}]`
            : null
          const notes = [recurrenceNote, item.notes].filter(Boolean).join(' ') || null

          const { error } = await supabase.from('tasks').insert({
            title: item.title,
            status: 'pending',
            created_by: createdBy,
            notes,
            priority: 2,
          } as any)
          if (error) throw new Error(error.message)
          break
        }

        case 'home_maintenance': {
          const freqMap: Record<string, string> = {
            daily: 'dia(s)',
            weekly: 'semana(s)',
            monthly: 'mês(es)',
            yearly: 'ano(s)',
          }
          const { error } = await supabase.from('home_maintenance').insert({
            family_id: familyId,
            title: item.title,
            emoji: '🔧',
            frequency_label: item.recurrence
              ? `A cada ${item.recurrence_interval ?? 1} ${freqMap[item.recurrence] ?? item.recurrence}`
              : 'Pontual',
            frequency_days: recurrenceToDays(item.recurrence, item.recurrence_interval),
            category: item.location?.toLowerCase() ?? 'geral',
            status: 'ok',
            notes: item.notes ?? null,
            created_by: createdBy,
            responsible_id: createdBy,
          } as any)
          if (error) throw new Error(error.message)
          break
        }

        case 'maintenance_call': {
          const { error } = await supabase.from('maintenance_calls').insert({
            family_id: familyId,
            title: item.title,
            description: item.location ? `Local: ${item.location}` : null,
            status: 'pending',
            priority: 2,
            created_by: createdBy,
          } as any)
          if (error) throw new Error(error.message)
          break
        }

        case 'family_event': {
          const { error } = await supabase.from('family_events').insert({
            family_id: familyId,
            title: item.title,
            event_date: item.date ?? new Date().toISOString().split('T')[0],
            event_time: item.time ?? null,
            event_type: 'general',
            created_by: createdBy,
            notes: item.notes ?? null,
            needs_action: false,
            is_done: false,
          } as any)
          if (error) throw new Error(error.message)
          break
        }

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
          } as any)
          if (error) throw new Error(error.message)
          break
        }

        case 'vaccine': {
          const { error } = await supabase.from('vaccines').insert({
            profile_id: createdBy,
            name: item.title,
            notes: item.notes ?? null,
          } as any)
          if (error) throw new Error(error.message)
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
