'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFamilyStore } from '@/store/familyStore'
import { useAuth } from './AuthProvider'
import { LoginScreen } from '../auth/LoginScreen'
import type { Profile } from '@/types/database'

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const { setFamily, setMembers, setCurrentUser, setLoading } = useFamilyStore()

  useEffect(() => {
    if (!session) return

    async function load() {
      setLoading(true)

      try {
        // 1. Busca perfil do usuário logado
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session!.user.id)
          .single()

        const profile = profileData as Profile | null

        // Se não tem perfil ainda, cria um básico
        if (!profile) {
          const { data: newProfile } = await supabase
            .from('profiles')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert({ id: session!.user.id, name: session!.user.email?.split('@')[0] ?? 'Usuário' } as any)
            .select()
            .single()
          if (newProfile) setCurrentUser(newProfile as Profile)
          setLoading(false)
          return
        }

        setCurrentUser(profile)

        // 2. Busca membros da família
        if (profile.family_id) {
          const { data: members } = await supabase
            .from('profiles')
            .select('*')
            .eq('family_id', profile.family_id)
            .order('birth_date', { ascending: true })

          setMembers((members ?? []) as Profile[])

          // 3. Busca dados da família
          const { data: family } = await supabase
            .from('families')
            .select('*')
            .eq('id', profile.family_id)
            .single()

          if (family) setFamily(family as any)
        }
      } catch (err) {
        console.error('[FamilyProvider] erro inesperado:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [session])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-400 text-sm">Carregando...</div>
      </div>
    )
  }

  // Sem sessão → mostra tela de login
  if (!session) {
    return <LoginScreen />
  }

  return <>{children}</>
}
