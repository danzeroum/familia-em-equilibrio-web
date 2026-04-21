// lib/chatbot-inserter.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { ParsedItem } from '@/types/chatbot'

// Tipos de Insert derivados do database.ts — fonte da verdade
type ShoppingInsert      = Database['public']['Tables']['shopping_items']['Insert']
type TaskInsert          = Database['public']['Tables']['tasks']['Insert']
type RecurrenceInsert    = Database['public']['Tables']['recurrence_rules']['Insert']
type HomeMaintenanceInsert = Database['public']['Tables']['home_maintenance']['Insert']
type MaintenanceCallInsert = Database['public']['Tables']['maintenance_calls']['Insert']
type FamilyEventInsert   = Database['public']['Tables']['family_events']['Insert']
type MedicationInsert    = Database['public']['Tables']['medications']['Insert']
type VaccineInsert       = Database['public']['Tables']['vaccines']['Insert']

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
          const payload: ShoppingInsert = {
            name: item.title,
            quantity: item.quantity ?? '1',
            category: item.category ?? 'Geral',
            domain_id: null,
            family_id: familyId,
            requested_by: createdBy,
            is_bought: false,
            bought_by: null,
            bought_at: null,
            is_recurring: false,
            restock_when_below: null,
            status: 'needed',
          }
          const { error } = await supabase.from('shopping_items').insert(payload)
          if (error) throw error
          break
        }

        // ── TASK ─────────────────────────────────────────────────────────
        case 'task': {
          let recurrence_id: string | null = null

          if (item.recurrence) {
            const rrPayload: RecurrenceInsert = {
              frequency: item.recurrence as RecurrenceInsert['frequency'],
              interval: item.recurrence_interval ?? 1,
              next_occurrence: new Date().toISOString().split('T')[0],
            }
            const { data: rr, error: rrErr } = await supabase
              .from('recurrence_rules')
              .insert(rrPayload)
              .select('id')
              .single()
            if (rrErr) throw rrErr
            recurrence_id = rr?.id ?? null
          }

          const payload: TaskInsert = {
            title: item.title,
            description: null,
            due_date: null,
            due_time: null,
            status: 'pending',
            assigned_to: null,
            created_by: createdBy,
            recurrence_id,
            notes: item.notes ?? null,
            priority: 2,
            domain_id: null,
            requires_supervision: false,
            validated_by: null,
            validated_at: null,
            visible_from: null,
            completed_at: null,
            checklist: [],
          }
          const { error } = await supabase.from('tasks').insert(payload)
          if (error) throw error
          break
        }

        // ── HOME MAINTENANCE (rotinas periódicas) ────────────────────────
        case 'home_maintenance': {
          const freqMap: Record<string, string> = {
            daily: 'dia(s)', weekly: 'semana(s)',
            monthly: 'mês(es)', yearly: 'ano(s)',
          }
          const payload: HomeMaintenanceInsert = {
            family_id: familyId,
            title: item.title,
            emoji: '🔧',
            frequency_label: item.recurrence
              ? `A cada ${item.recurrence_interval ?? 1} ${freqMap[item.recurrence] ?? 'período(s)'}`
              : 'Pontual',
            frequency_days: recurrenceToDays(item.recurrence, item.recurrence_interval),
            category: item.location?.toLowerCase() ?? 'geral',
            status: 'ok',
            notes: item.notes ?? null,
            created_by: createdBy,
            responsible_id: createdBy,
            last_done_at: null,
            next_due_at: null,
          }
          const { error } = await supabase.from('home_maintenance').insert(payload)
          if (error) throw error
          break
        }

        // ── MAINTENANCE CALL (reparos pontuais) ──────────────────────────
        case 'maintenance_call': {
          const payload: MaintenanceCallInsert = {
            family_id: familyId,
            title: item.title,
            description: item.location ? `Local: ${item.location}` : null,
            status: 'pending',
            priority: 2,
            created_by: createdBy,
            domain_id: null,
            professional_name: null,
            professional_phone: null,
            estimated_cost: null,
            scheduled_date: null,
            completed_at: null,
          }
          const { error } = await supabase.from('maintenance_calls').insert(payload)
          if (error) throw error
          break
        }

        // ── FAMILY EVENT ─────────────────────────────────────────────────
        case 'family_event': {
          const payload: FamilyEventInsert = {
            family_id: familyId,
            title: item.title,
            event_date: item.date ?? new Date().toISOString().split('T')[0],
            event_time: item.time ?? null,
            event_type: 'general',
            created_by: createdBy,
            description: item.notes ?? null,
            notes: null,
            needs_action: false,
            action_description: null,
            budget: null,
            budget_estimate: null,
            is_done: false,
            location: null,
            assigned_to: null,
            participants: null,
          }
          const { error } = await supabase.from('family_events').insert(payload)
          if (error) throw error
          break
        }

        // ── MEDICATION ───────────────────────────────────────────────────
        case 'medication': {
          const payload: MedicationInsert = {
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
            concentration: null,
            expiry_date: null,
            storage_location: null,
            notes: null,
            action_description: null,
            action_date: null,
          }
          const { error } = await supabase.from('medications').insert(payload)
          if (error) throw error
          break
        }

        // ── VACCINE ──────────────────────────────────────────────────────
        case 'vaccine': {
          const payload: VaccineInsert = {
            profile_id: createdBy,
            name: item.title,
            applied_at: null,
            next_due: null,
            notes: item.notes ?? null,
          }
          const { error } = await supabase.from('vaccines').insert(payload)
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
