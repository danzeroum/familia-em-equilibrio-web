import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Family, Profile } from '@/types/database'

interface FamilyStore {
  family: Family | null
  currentFamily: Family | null
  members: Profile[]
  currentUser: Profile | null
  isLoading: boolean
  reload: () => Promise<void>
  setFamily: (family: Family) => void
  setMembers: (members: Profile[]) => void
  setCurrentUser: (user: Profile) => void
  setLoading: (loading: boolean) => void
  getMemberById: (id: string) => Profile | undefined
  getMemberColor: (id: string) => string
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  family: null,
  currentFamily: null,
  members: [],
  currentUser: null,
  isLoading: true,

  setFamily: (family) => {
    console.log('[familyStore] setFamily:', family)
    set({ family, currentFamily: family })
  },

  setMembers: (members) => {
    console.log('[familyStore] setMembers:', members)
    set({ members })
  },

  setCurrentUser: (user) => {
    console.log('[familyStore] setCurrentUser:', user)
    set({ currentUser: user })
  },

  setLoading: (isLoading) => set({ isLoading }),

  reload: async () => {
    const { family } = get()
    console.log('[familyStore] reload() - family:', family)

    if (!family) {
      console.warn('[familyStore] reload() abortado: family é null')
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', family.id)

    console.log('[familyStore] reload() resultado:', { data, error })
    if (error) console.error('[familyStore] reload() ERRO:', { message: error.message, code: error.code, details: error.details, hint: error.hint })

    if (data) set({ members: data })
  },

  getMemberById: (id) => get().members.find((m) => m.id === id),

  getMemberColor: (id) => {
    const member = get().members.find((m) => m.id === id)
    return member?.color_hex ?? '#4A90D9'
  },
}))
