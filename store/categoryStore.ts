import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface TaskCategory {
  id: string
  family_id: string | null
  name: string
  emoji: string
  group_name: string
  is_default: boolean
  created_at: string
}

interface CategoryStore {
  categories: TaskCategory[]
  loading: boolean
  load: () => Promise<void>
  addCategory: (name: string, emoji: string, group_name: string, family_id: string) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  loading: false,

  load: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('task_categories')
      .select('*')
      .order('group_name')
      .order('name')
    if (!error && data) set({ categories: data })
    set({ loading: false })
  },

  addCategory: async (name, emoji, group_name, family_id) => {
    const { data, error } = await supabase
      .from('task_categories')
      .insert({ name, emoji, group_name, family_id, is_default: false })
      .select()
      .single()
    if (!error && data) {
      set({ categories: [...get().categories, data] })
    } else {
      console.error('[categoryStore] addCategory erro:', error)
      throw error
    }
  },

  deleteCategory: async (id) => {
    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('id', id)
    if (!error) {
      set({ categories: get().categories.filter(c => c.id !== id) })
    } else {
      console.error('[categoryStore] deleteCategory erro:', error)
      throw error
    }
  },
}))
