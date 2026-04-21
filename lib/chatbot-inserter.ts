import { supabase } from '@/lib/supabase'
import { ParsedItem } from '@/types/chatbot';

function recurrenceToDays(r?: string | null, interval?: number | null): number {
  const i = interval ?? 1;
  if (r === 'daily')   return i;
  if (r === 'weekly')  return i * 7;
  if (r === 'monthly') return i * 30;
  if (r === 'yearly')  return i * 365;
  return 365;
}

export async function insertParsedItems(
  items: ParsedItem[],
  familyId: string,
  createdBy: string
) {
  const results = { inserted: 0, failed: 0, errors: [] as string[] };

  for (const item of items) {
    try {
      switch (item.type) {

        case 'shopping': {
          await supabase.from('shopping_items').insert({
            family_id: familyId,
            name: item.title,
            quantity: item.quantity ?? '1',
            category: item.category ?? 'Geral',
            status: 'needed',
            is_bought: false,
            is_recurring: false,
            requested_by: createdBy,
          });
          break;
        }

        case 'task': {
          let recurrence_id: string | null = null;

          if (item.recurrence) {
            const { data: rr } = await supabase
              .from('recurrence_rules')
              .insert({
                frequency: item.recurrence,
                interval: item.recurrence_interval ?? 1,
                next_occurrence: new Date().toISOString().split('T')[0],
              })
              .select('id')
              .single();
            recurrence_id = rr?.id ?? null;
          }

          await supabase.from('tasks').insert({
            title: item.title,
            status: 'pending',
            created_by: createdBy,
            recurrence_id,
            notes: item.notes ?? null,
            priority: 2,
          });
          break;
        }

        case 'home_maintenance': {
          await supabase.from('home_maintenance').insert({
            family_id: familyId,
            title: item.title,
            emoji: '🔧',
            frequency_label: item.recurrence
              ? `A cada ${item.recurrence_interval ?? 1} ${
                  ({ daily:'dia(s)', weekly:'semana(s)',
                    monthly:'mês(es)', yearly:'ano(s)' } as Record<string,string>)[item.recurrence] ?? item.recurrence
                }`
              : 'Pontual',
            frequency_days: recurrenceToDays(item.recurrence, item.recurrence_interval),
            category: item.location?.toLowerCase() ?? 'geral',
            status: 'ok',
            notes: item.notes ?? null,
            created_by: createdBy,
            responsible_id: createdBy,
          });
          break;
        }

        case 'maintenance_call': {
          await supabase.from('maintenance_calls').insert({
            family_id: familyId,
            title: item.title,
            description: item.location ? `Local: ${item.location}` : null,
            status: 'pending',
            priority: 2,
            created_by: createdBy,
          });
          break;
        }

        case 'family_event': {
          await supabase.from('family_events').insert({
            family_id: familyId,
            title: item.title,
            event_date: item.date ?? new Date().toISOString().split('T')[0],
            event_time: item.time ?? null,
            event_type: 'general',
            created_by: createdBy,
            notes: item.notes ?? null,
            needs_action: false,
            is_done: false,
          });
          break;
        }

        case 'medication': {
          await supabase.from('medications').insert({
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
          });
          break;
        }

        case 'vaccine': {
          await supabase.from('vaccines').insert({
            profile_id: createdBy,
            name: item.title,
            notes: item.notes ?? null,
          });
          break;
        }
      }

      results.inserted++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`[${item.type}] ${item.title}: ${err.message}`);
    }
  }

  return results;
}
