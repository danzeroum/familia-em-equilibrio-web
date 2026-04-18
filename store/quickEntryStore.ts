import { create } from 'zustand'

export type QuickEntryEntity =
  | 'task'
  | 'bill'
  | 'medication'
  | 'vaccine'
  | 'shopping'
  | 'maintenance'
  | 'event'
  | 'checkin'

interface QuickEntryStore {
  open: boolean
  entity: QuickEntryEntity
  savedCount: number
  setEntity: (e: QuickEntryEntity) => void
  openModal: (entity?: QuickEntryEntity) => void
  toggle: () => void
  close: () => void
  incSaved: () => void
}

export const useQuickEntryStore = create<QuickEntryStore>((set) => ({
  open: false,
  entity: 'task',
  savedCount: 0,

  setEntity: (entity) => set({ entity }),

  openModal: (entity) =>
    set((state) => ({
      open: true,
      savedCount: 0,
      entity: entity ?? state.entity,
    })),

  toggle: () =>
    set((state) => ({
      open: !state.open,
      savedCount: state.open ? state.savedCount : 0,
    })),

  close: () => set({ open: false, savedCount: 0 }),

  incSaved: () => set((state) => ({ savedCount: state.savedCount + 1 })),
}))
