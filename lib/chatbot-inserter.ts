import { createClient } from '@/lib/supabase';
import { ParsedItem } from '@/types/chatbot';

// Mapeia texto de recorrência para frequency_days (home_maintenance)
function recurrenceToDays(r?: string, interval?: number): number {
  const i = interval ?? 1;
  if (r === 'daily')   return i;
  if (r === 'weekly')  return i * 7;
  if (r === 'monthly') return i * 30;
  if (r === 'yearly')  return i * 365;
  return 0; // sem recorrência = pontual
}

export async function insertParsedItems(
  items: ParsedItem[],
  familyId: string,
  createdBy: string   // profile UUID do usuário logado — obrigatório
) {
  const supabase = createClient();
  const results = { inserted: 0, failed: 0, errors: [] as string[] };

  for (const item of items) {
    try {
      switch (item.type) {

        // ─── SHOPPING ──────────────────────────────────────────────────
        case 'shopping': {
          await supabase.from('shopping_items').insert({
            family_id: familyId,
            name: item.title,
            quantity: item.quantity ?? '1',
            category: item.category ?? 'Geral',
            status: 'needed',         // default da tabela
            is_bought: false,
            requested_by: createdBy,
          });
          break;
        }

        // ─── TASK ───────────────────────────────────────────────────────
        case 'task': {
          let recurrence_id: string | null = null;

          // Cria recurrence_rule primeiro se tiver recorrência
          if (item.recurrence) {
            const { data: rr } = await supabase
              .from('recurrence_rules')
              .insert({
                frequency: item.recurrence,                    // 'daily'|'weekly'|'monthly'|'yearly'
                interval: item.recurrence_interval ?? 1,
                next_occurrence: new Date().toISOString().split('T')[0],
              })
              .select('id')
              .single();
            recurrence_id = rr?.id ?? null;
          }

          await supabase.from('tasks').insert({
            family_id: familyId,   // ⚠️ tasks NÃO tem family_id direto
            // ↑ tasks usa family via domain_id ou assigned_to — ver nota abaixo
            title: item.title,
            status: 'pending',
            created_by: createdBy,
            recurrence_id,
            notes: item.notes ?? null,
            priority: 2,           // default médio
          });
          break;
        }

        // ─── HOME MAINTENANCE ───────────────────────────────────────────
        case 'home_maintenance': {
          const freqDays = recurrenceToDays(item.recurrence, item.recurrence_interval);
          await supabase.from('home_maintenance').insert({
            family_id: familyId,
            title: item.title,
            emoji: '🔧',
            frequency_label: item.recurrence
              ? `A cada ${item.recurrence_interval ?? 1} ${
                  item.recurrence === 'weekly' ? 'semana(s)' :
                  item.recurrence === 'monthly' ? 'mês(es)' :
                  item.recurrence === 'daily' ? 'dia(s)' : 'ano(s)'
                }`
              : 'Pontual',
            frequency_days: freqDays > 0 ? freqDays : 999, // 999 = sem recorrência definida
            category: item.location?.toLowerCase() ?? 'geral',
            notes: item.notes ?? null,
            status: 'ok',
            created_by: createdBy,
            responsible_id: createdBy,
          });
          break;
        }

        // ─── FAMILY EVENT ───────────────────────────────────────────────
        case 'family_event': {
          await supabase.from('family_events').insert({
            family_id: familyId,
            title: item.title,
            event_date: item.date ?? new Date().toISOString().split('T')[0],
            event_time: item.time ?? null,          // time without time zone
            event_type: 'general',
            created_by: createdBy,
            notes: item.notes ?? null,
            needs_action: false,
            is_done: false,
          });
          break;
        }

        // ─── MEDICATION ─────────────────────────────────────────────────
        case 'medication': {
          await supabase.from('medications').insert({
            profile_id: createdBy,   // medications usa profile_id, NÃO family_id
            name: item.title,
            dosage: item.notes ?? null,
            form: 'other',
            is_active: true,
            item_condition: 'ok',
            stock_quantity: item.quantity ? parseInt(item.quantity) || 1 : 1,
            minimum_stock: 1,
          });
          break;
        }

        // ─── VACCINE ────────────────────────────────────────────────────
        case 'vaccine': {
          await supabase.from('vaccines').insert({
            profile_id: createdBy,   // vaccines também usa profile_id
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
