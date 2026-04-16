import { create } from 'zustand'

type SheetType =
  | 'add-member'
  | 'edit-member'
  | 'add-bill'
  | 'edit-bill'
  | 'add-event'
  | 'edit-event'
  | 'add-task'
  | 'edit-task'
  | 'add-medication'
  | 'edit-medication'
  | 'add-vaccine'
  | 'edit-vaccine'
  | 'add-emergency-contact'
  | 'add-checkin'
  | 'add-wardrobe'
  | null

interface UIStore {
  activeSheet: SheetType
  sheetData: Record<string, unknown> | null
  openSheet: (type: SheetType, data?: Record<string, unknown>) => void
  closeSheet: () => void
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'destructive'
}

export const useUIStore = create<UIStore>((set) => ({
  activeSheet: null,
  sheetData: null,

  openSheet: (type, data = null) =>
    set({ activeSheet: type, sheetData: data }),

  closeSheet: () =>
    set({ activeSheet: null, sheetData: null }),

  toasts: [],

  addToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: Math.random().toString(36).slice(2) },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
