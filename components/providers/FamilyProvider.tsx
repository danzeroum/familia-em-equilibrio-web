'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { setFamily, setMembers, setCurrentUser, setLoading } = useFamilyStore()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        // 1. Busca o primeiro perfil disponível (app caseiro, sem auth complexo)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .single()

        if (!profileData) { setLoading(false); return }

        setCurrentUser(profileData)

        // 2. Busca todos os membros da mesma família
        if (profileData.family_id) {
          const { data: members } = await supabase
            .from('profiles')
            .select('*')
            .eq('family_id', profileData.family_id)
            .order('birth_date', { ascending: true })

          setMembers(members ?? [])

          // 3. Busca os dados da família
          const { data: family } = await supabase
            .from('families')
            .select('*')
            .eq('id', profileData.family_id)
            .single()

          if (family) setFamily(family)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return <>{children}</>
}
