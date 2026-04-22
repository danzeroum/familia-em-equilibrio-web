import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import { QuickRegisterType } from '@/types/database'

export function useQuickRegister() {
  const supabase = supabase
  const { familyId } = useFamilyStore()

  async function save(type: QuickRegisterType, data: Record<string, unknown>) {
    const payload = { ...data, family_id: familyId }

    const tableMap: Record<QuickRegisterType, string> = {
      task: 'tasks',
      subtask: 'subtasks',
      medication: 'medications',
      bill: 'bills',
      shopping: 'shopping_items',
      maintenance: 'home_maintenance',
      event: 'family_events',
      vaccine: 'vaccines',
      mood: 'emotional_checkins',
      health_tracking: 'health_tracking',
      homework: 'homework',
      school_item: 'school_items',
      emergency_contact: 'emergency_contacts',
      gratitude: 'gratitude_notes',
      maintenance_call: 'maintenance_calls',
    }

    const table = tableMap[type]
    if (!table) throw new Error(`Tipo desconhecido: ${type}`)

    const { error } = await supabase.from(table).insert(payload)
    if (error) throw error
  }

  return { save }
}
