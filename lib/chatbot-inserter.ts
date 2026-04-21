// lib/chatbot-inserter.ts
import { createClient } from '@/lib/supabase'
import { ParsedItem, InsertResult } from '@/types/chatbot'

function parseDateBR(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  // Tenta ISO primeiro
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr
  // Tenta DD/MM/YYYY
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  // Texto como "Sábado" — não converte, coloca em notes
  return null
}

export async function insertParsedItems(
  items: ParsedItem[],
  familyId: string,
  createdBy?: string
): Promise<InsertResult> {
  const supabase = createClient()
  const result: InsertResult = { inserted: 0, failed: 0, errors: [] }

  for (const item of items) {
    if (item.type === 'unknown') continue

    try {
      switch (item.type) {
        // ── COMPRAS ──────────────────────────────────────────────
        case 'shopping': {
          const { error } = await supabase.from('shopping_items').insert({
            family_id: familyId,
            name: item.title,
            quantity: item.quantity ?? '1',
            category: item.category ?? 'Geral',
            status: 'needed',
            is_recurring: false,
            is_bought: false,
            requested_by: createdBy ?? null,
          })
          if (error) throw error
          break
        }

        // ── TAREFAS ──────────────────────────────────────────────
        case 'task': {
          const notes = [
            item.recurrence ? `Recorrência: ${item.recurrence}` : null,
            item.notes,
          ]
            .filter(Boolean)
            .join(' | ') || null

          const { error } = await supabase.from('tasks').insert({
            title: item.title,
            status: 'pending',
            priority: 2,
            notes,
            created_by: createdBy ?? null,
            requires_supervision: false,
          })
          if (error) throw error
          break
        }

        // ── MANUTENÇÃO RECORRENTE ────────────────────────────────
        case 'home_maintenance': {
          const { error } = await supabase.from('home_maintenance').insert({
            family_id: familyId,
            title: item.title,
            category: item.category ?? item.location ?? 'Casa',
            frequency_label: item.recurrence ?? 'Sob demanda',
            frequency_days: 30,
            status: 'ok',
            notes: item.notes ?? null,
            created_by: createdBy ?? null,
          })
          if (error) throw error
          break
        }

        // ── CHAMADO DE MANUTENÇÃO ────────────────────────────────
        case 'maintenance_call': {
          const { error } = await supabase.from('maintenance_calls').insert({
            family_id: familyId,
            title: item.title,
            description: item.location
              ? `Local: ${item.location}${item.notes ? ` — ${item.notes}` : ''}`
              : item.notes ?? null,
            status: 'pending',
            priority: 2,
            created_by: createdBy ?? null,
          })
          if (error) throw error
          break
        }

        // ── EVENTO NO CALENDÁRIO ─────────────────────────────────
        case 'calendar_event': {
          const eventDate = parseDateBR(item.date)
          const notes = [
            !eventDate && item.date ? `Data mencionada: ${item.date}` : null,
            item.time ? `Horário: ${item.time}` : null,
            item.notes,
          ]
            .filter(Boolean)
            .join(' | ') || null

          const { error } = await supabase.from('family_events').insert({
            family_id: familyId,
            title: item.title,
            event_date: eventDate ?? new Date().toISOString().split('T')[0],
            event_time: item.time ?? null,
            event_type: 'general',
            needs_action: false,
            is_done: false,
            notes,
            created_by: createdBy ?? null,
          })
          if (error) throw error
          break
        }

        // ── MEDICAMENTO ──────────────────────────────────────────
        case 'medication': {
          const { error } = await supabase.from('medications').insert({
            name: item.title,
            dosage: item.quantity ?? null,
            dosage_interval_hours: 8,
            weight_based: false,
            form: 'other',
            max_doses_per_day: 3,
            stock_quantity: parseInt(item.quantity ?? '1') || 1,
            minimum_stock: 1,
            notes: item.notes ?? null,
            is_active: true,
            item_condition: 'ok',
          })
          if (error) throw error
          break
        }

        // ── VACINA ────────────────────────────────────────────────
        case 'vaccine': {
          const { error } = await supabase.from('vaccines').insert({
            name: item.title,
            notes: item.notes ?? null,
          })
          if (error) throw error
          break
        }
      }

      result.inserted++
    } catch (err: unknown) {
      result.failed++
      const message = err instanceof Error ? err.message : String(err)
      result.errors.push(`[${item.type}] ${item.title}: ${message}`)
    }
  }

  return result
}
