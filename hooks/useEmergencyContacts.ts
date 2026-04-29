'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { EmergencyContact } from '@/types/database'

export function useEmergencyContacts(familyId: string | null) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!familyId) { setIsLoading(false); return }
    load()
  }, [familyId])

  async function load() {
    setIsLoading(true)
    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('family_id', familyId!)
      .order('is_primary', { ascending: false })
    setContacts(data ?? [])
    setIsLoading(false)
  }

  async function upsert(contact: Partial<EmergencyContact> & { name: string; phone: string }) {
    if (contact.id) {
      const { id: _id, created_at: _cat, ...updateData } = contact
      await supabase.from('emergency_contacts').update(updateData).eq('id', contact.id)
    } else {
      await supabase.from('emergency_contacts').insert({ ...contact, family_id: familyId } as any)
    }
    await load()
  }

  async function remove(id: string) {
    await supabase.from('emergency_contacts').delete().eq('id', id)
    await load()
  }

  return { contacts, isLoading, upsert, remove, reload: load }
}
