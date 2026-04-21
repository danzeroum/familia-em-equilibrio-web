import { createClient } from '@/lib/supabase';
import { ParsedItem } from '@/types/chatbot';

function recurrenceToDays(r?: string | null, interval?: number | null): number {
  const i = interval ?? 1;
  if (r === 'daily')   return i;
  if (r === 'weekly')  return i * 7;
  if (r === 'monthly') return i * 30;
  if (r === 'yearly')  return i * 365;
  return 365; // fallback seguro para home_maintenance NOT NULL
}

export async function insertParsedItems(
  items: ParsedItem[],
  familyId: string,
  createdBy: string  // UUID do profile logado — obrigatório para RLS
) {
  const supabase = createClient();
  const results = { inserted: 0, failed: 0, errors: [] as string[] };

  for (const item of items) {
    try {
      switch (item.type) {

        // ── SHOPPING ────────────────────────────────────────────────────
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

        // ── TASK ─────────────────────────────────────────────────────────
        // tasks NÃO tem family_id — RLS é resolvido via created_by → profiles.family_id
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
            created_by: createdBy,     // ← vínculo com família via profile
            recurrence_id,
            notes: item.notes ?? null,
            priority: 2,
          });
          break;
        }

        // ── HOME MAINTENANCE (rotinas periódicas) ────────────────────────
        // Ex: "Lavar louça todo dia", "Trocar roupa de cama 1x/semana"
        case 'home_maintenance': {
          await supabase.from('home_maintenance').insert({
            family_id: familyId,
            title: item.title,
            emoji: '🔧',
            frequency_label: item.recurrence
              ? `A cada ${item.recurrence_interval ?? 1} ${
                  { daily:'dia(s)', weekly:'semana(s)',
                    monthly:'mês(es)', yearly:'ano(s)' }[item.recurrence]
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

        // ── MAINTENANCE CALL (reparos pontuais) ──────────────────────────
        // Ex: "Fixar tampas das privadas", "Arrumar tomadas", "Instalar ralo"
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

        // ── FAMILY EVENT ─────────────────────────────────────────────────
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

        // ── MEDICATION ───────────────────────────────────────────────────
        // medications usa profile_id (NÃO family_id)
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

        // ── VACCINE ──────────────────────────────────────────────────────
        // vaccines usa profile_id (NÃO family_id)
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
