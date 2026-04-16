import { create } from 'zustand'
import type { Family, Profile } from '@/types/database'

interface FamilyStore {
  family: Family | null
  members: Profile[]
  currentUser: Profile | null
  isLoading: boolean

  setFamily: (family: Family) => void
  setMembers: (members: Profile[]) => void
  setCurrentUser: (user: Profile) => void
  setLoading: (loading: boolean) => void
  getMemberById: (id: string) => Profile | undefined
  getMemberColor: (id: string) => string
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  family: null,
  members: [],
  currentUser: null,
  isLoading: true,

  setFamily: (family) => set({ family }),
  setMembers: (members) => set({ members }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (isLoading) => set({ isLoading }),

  getMemberById: (id) => get().members.find((m) => m.id === id),

  getMemberColor: (id) => {
    const member = get().members.find((m) => m.id === id)
    return member?.color_hex ?? '#4A90D9'
  },
}))
